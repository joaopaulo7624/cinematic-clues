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
    const { description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    if (!LOVABLE_API_KEY || !TMDB_API_KEY) {
      throw new Error("Chaves de API não configuradas.");
    }

    // --- Passo 1: Usar IA para adivinhar os títulos dos filmes ---
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

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error("Erro na chamada da IA:", aiResponse.status, errorBody);
      throw new Error(`Erro na chamada da IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("A IA não retornou um resultado válido.");
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON da IA:", e, "Conteúdo recebido:", rawContent);
      throw new Error("A IA retornou um formato de dados inesperado.");
    }

    const suggestedTitles = parsedContent.titles;

    if (!suggestedTitles || !Array.isArray(suggestedTitles) || suggestedTitles.length === 0) {
      return new Response(JSON.stringify({ movies: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Passo 2: Buscar detalhes de cada filme sugerido no TMDB ---
    const moviePromises = suggestedTitles.map(async (title: string) => {
      const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
      tmdbUrl.searchParams.append("api_key", TMDB_API_KEY);
      tmdbUrl.searchParams.append("query", title);
      tmdbUrl.searchParams.append("language", "pt-BR");
      tmdbUrl.searchParams.append("include_adult", "false");

      const tmdbResponse = await fetch(tmdbUrl);
      if (!tmdbResponse.ok) return null;
      
      const tmdbData = await tmdbResponse.json();
      const movie = tmdbData.results[0];

      if (!movie) return null;

      return {
        title: movie.title,
        year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
        description: movie.overview || "Sinopse não disponível.",
        poster_path: movie.poster_path,
      };
    });

    const movieDetails = (await Promise.all(moviePromises)).filter(Boolean);

    // --- Passo 3: Formatar a resposta final com nível de confiança ---
    const movies = movieDetails.map((movie, index) => ({
      ...movie,
      confidence: index === 0 ? "Alta" : index === 1 ? "Média" : "Baixa",
    }));

    return new Response(
      JSON.stringify({ movies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro na função identify-movie:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage, movies: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});