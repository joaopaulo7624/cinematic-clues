// @ts-ignore: This is a Deno-specific import that is not recognized by the local TS environment.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Declare the Deno global to resolve TypeScript errors in the local environment.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("--- identify-movie function invoked (using Google Gemini API) ---");
    const { description } = await req.json();
    if (!description) {
      throw new Error("Descrição não fornecida.");
    }
    console.log("Descrição recebida:", description);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("ERRO: Chave de API (GEMINI_API_KEY) não configurada nos segredos do Supabase.");
      throw new Error("Chave da API do Gemini não configurada no servidor.");
    }
    if (!TMDB_API_KEY) {
      console.error("ERRO: Chave de API (TMDB_API_KEY) não configurada nos segredos do Supabase.");
      throw new Error("Chave da API do TMDB não configurada no servidor.");
    }
    console.log("Chaves de API encontradas. Prosseguindo...");

    // --- Passo 1: Chamar a API do Google Gemini ---
    console.log("Chamando a API do Google Gemini com o modelo gemini-pro...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `Você é um especialista em cinema. Sua tarefa é identificar filmes a partir de descrições de cenas.
    Analise a seguinte descrição do usuário e retorne um objeto JSON com uma chave "titles", que contém um array de até 3 possíveis títulos de filmes em português.
    Descrição do usuário: "${description}"
    Exemplo de saída:
    {
      "titles": ["Matrix", "Duro de Matar", "Equilibrium"]
    }
    Responda APENAS com o objeto JSON.`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ "text": prompt }]
        }],
        generationConfig: {
          "response_mime_type": "application/json",
        }
      }),
    });

    console.log(`Resposta da Gemini API recebida com status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("ERRO na chamada da Gemini API. Corpo da resposta:", errorBody);
      throw new Error(`A Gemini API retornou um erro: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.error("ERRO: Resposta da Gemini API não continha conteúdo:", JSON.stringify(geminiData));
      throw new Error("A Gemini API não retornou um resultado válido.");
    }
    console.log("Conteúdo bruto da Gemini API:", rawContent);

    // --- Passo 2: Parsear JSON ---
    let parsedContent;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (e) {
      console.error("ERRO ao fazer parse do JSON da Gemini API:", e, "JSON String:", rawContent);
      throw new Error("A Gemini API retornou um formato de dados inesperado.");
    }
    console.log("JSON parseado com sucesso.");

    const suggestedTitles = parsedContent.titles;

    if (!suggestedTitles || !Array.isArray(suggestedTitles) || suggestedTitles.length === 0) {
      console.log("Nenhum título sugerido pela IA. Retornando array vazio.");
      return new Response(JSON.stringify({ movies: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log("Títulos sugeridos:", suggestedTitles.join(", "));

    // --- Passo 3: Buscar detalhes de cada filme sugerido no TMDB ---
    console.log("Buscando detalhes dos filmes no TMDB...");
    const moviePromises = suggestedTitles.slice(0, 3).map(async (title: string) => {
      if (typeof title !== 'string' || !title.trim()) return null;
      
      const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
      tmdbUrl.searchParams.append("api_key", TMDB_API_KEY);
      tmdbUrl.searchParams.append("query", title);
      tmdbUrl.searchParams.append("language", "pt-BR");
      tmdbUrl.searchParams.append("include_adult", "false");

      const tmdbResponse = await fetch(tmdbUrl);
      if (!tmdbResponse.ok) {
        console.warn(`Aviso: A chamada ao TMDB para "${title}" falhou com status ${tmdbResponse.status}`);
        return null;
      }
      
      const tmdbData = await tmdbResponse.json();
      const movie = tmdbData.results[0];

      if (!movie) {
        console.warn(`Aviso: Nenhum resultado no TMDB para "${title}"`);
        return null;
      }

      return {
        title: movie.title,
        year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
        description: movie.overview || "Sinopse não disponível.",
        poster_path: movie.poster_path,
      };
    });

    const movieDetails = (await Promise.all(moviePromises)).filter(Boolean);
    console.log(`Encontrados ${movieDetails.length} filmes no TMDB.`);

    // --- Passo 4: Formatar a resposta final com nível de confiança ---
    const movies = movieDetails.map((movie, index) => ({
      ...movie,
      confidence: index === 0 ? "Alta" : index === 1 ? "Média" : "Baixa",
    }));

    console.log("Retornando resultados formatados com sucesso.");
    return new Response(
      JSON.stringify({ movies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("--- ERRO FATAL na função identify-movie ---", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconquecido no servidor';
    return new Response(
      JSON.stringify({ error: errorMessage, movies: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});