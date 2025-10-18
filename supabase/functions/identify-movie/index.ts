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
    console.log("--- identify-movie function invoked ---");
    const { description } = await req.json();
    if (!description) {
      throw new Error("Descrição não fornecida.");
    }
    console.log("Descrição recebida:", description);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    if (!LOVABLE_API_KEY || !TMDB_API_KEY) {
      console.error("ERRO: Chaves de API (LOVABLE_API_KEY ou TMDB_API_KEY) não configuradas nos segredos do Supabase.");
      throw new Error("Chaves de API não configuradas no servidor.");
    }
    console.log("Chaves de API encontradas. Prosseguindo...");

    // --- Passo 1: Chamar IA ---
    console.log("Chamando a IA para obter títulos de filmes...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em cinema. Sua tarefa é identificar filmes a partir de descrições de cenas.
            Analise a descrição do usuário e retorne um objeto JSON com uma chave "titles", que contém um array de até 3 possíveis títulos de filmes em português.
            Exemplo de entrada: "um homem de terno preto lutando em um prédio, câmera lenta, anos 90"
            Exemplo de saída:
            {
              "titles": ["Matrix", "Duro de Matar", "Equilibrium"]
            }
            Responda APENAS com o objeto JSON.`
          },
          {
            role: "user",
            content: description
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    console.log(`Resposta da IA recebida com status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error("ERRO na chamada da IA. Corpo da resposta:", errorBody);
      throw new Error(`A IA retornou um erro: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices[0]?.message?.content;

    if (!rawContent) {
      console.error("ERRO: Resposta da IA não continha conteúdo:", JSON.stringify(aiData));
      throw new Error("A IA não retornou um resultado válido.");
    }
    console.log("Conteúdo bruto da IA:", rawContent);

    // --- Passo 2: Extrair e parsear JSON ---
    console.log("Extraindo JSON da resposta da IA...");
    const jsonMatch = rawContent.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.error("ERRO: Nenhum JSON encontrado na resposta da IA.");
      throw new Error("A IA não retornou um formato de dados reconhecível.");
    }

    const jsonString = jsonMatch[0];
    let parsedContent;
    try {
      parsedContent = JSON.parse(jsonString);
    } catch (e) {
      console.error("ERRO ao fazer parse do JSON extraído:", e, "JSON String:", jsonString);
      throw new Error("A IA retornou um formato de dados inesperado.");
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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor';
    return new Response(
      JSON.stringify({ error: errorMessage, movies: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});