// @ts-ignore: This is a Deno-specific import that is not recognized by the local TS environment.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Declare the Deno global to resolve TypeScript errors in the local environment.
// This does not affect the Deno runtime.
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
      throw new Error("Chaves de API não configuradas. Verifique LOVABLE_API_KEY e TMDB_API_KEY.");
    }

    // --- Fase 1: Extrair palavras-chave com IA ---
    const keywordExtractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Sua tarefa é extrair informações-chave de uma descrição de filme.
            Analise o texto e retorne um objeto JSON válido com:
            - "keywords": uma string com as palavras-chave mais importantes para a busca.
            - "year": uma string representando o ano mais provável (ex: "1999"). Se não for mencionado, retorne uma string vazia.
            
            Exemplo de entrada: "um homem de terno preto lutando em um prédio, câmera lenta, acho que era dos anos 90"
            Exemplo de saída:
            {
              "keywords": "luta prédio terno preto câmera lenta",
              "year": "1999"
            }
            
            Responda APENAS com o objeto JSON.`
          },
          {
            role: "user",
            content: description
          }
        ],
      }),
    });

    if (!keywordExtractionResponse.ok) {
      throw new Error(`Erro na extração de palavras-chave: ${keywordExtractionResponse.status}`);
    }

    const extractionData = await keywordExtractionResponse.json();
    const aiResponseContent = extractionData.choices[0].message.content;
    
    let searchParams;
    try {
      const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        searchParams = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Formato de resposta da IA inválido para extração");
      }
    } catch (e) {
      console.error("Erro ao parsear extração da IA:", e);
      searchParams = { keywords: description.split(" ").slice(0, 10).join(" "), year: "" };
    }

    // --- Fase 2: Buscar filmes no TMDB ---
    const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
    tmdbUrl.searchParams.append("api_key", TMDB_API_KEY);
    tmdbUrl.searchParams.append("query", searchParams.keywords);
    tmdbUrl.searchParams.append("language", "pt-BR");
    tmdbUrl.searchParams.append("include_adult", "false");
    if (searchParams.year) {
      tmdbUrl.searchParams.append("primary_release_year", searchParams.year);
    }

    const tmdbResponse = await fetch(tmdbUrl);
    if (!tmdbResponse.ok) {
      throw new Error(`Erro na API do TMDB: ${tmdbResponse.status}`);
    }
    const tmdbData = await tmdbResponse.json();

    // --- Fase 3: Formatar a resposta ---
    const movies = tmdbData.results.slice(0, 4).map((movie: any, index: number) => ({
      title: movie.title,
      year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
      description: movie.overview || "Sinopse não disponível.",
      poster_path: movie.poster_path,
      confidence: index === 0 ? "Alta" : index < 2 ? "Média" : "Baixa",
    }));

    return new Response(
      JSON.stringify({ movies }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error("Erro na function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        movies: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});