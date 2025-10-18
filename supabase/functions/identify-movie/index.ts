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
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    if (!TMDB_API_KEY) {
      throw new Error("Chave de API do TMDB não configurada.");
    }

    // --- Fase 1: Buscar filmes no TMDB usando a descrição completa ---
    const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
    tmdbUrl.searchParams.append("api_key", TMDB_API_KEY);
    tmdbUrl.searchParams.append("query", description); // Usando a descrição do usuário diretamente
    tmdbUrl.searchParams.append("language", "pt-BR");
    tmdbUrl.searchParams.append("include_adult", "false");

    const tmdbResponse = await fetch(tmdbUrl);
    if (!tmdbResponse.ok) {
      throw new Error(`Erro na API do TMDB: ${tmdbResponse.status}`);
    }
    const tmdbData = await tmdbResponse.json();

    // --- Fase 2: Formatar a resposta ---
    const movies = tmdbData.results.slice(0, 4).map((movie: any, index: number) => ({
      title: movie.title,
      year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
      description: movie.overview || "Sinopse não disponível.",
      poster_path: movie.poster_path,
      // A confiança agora é baseada na ordem de resultados do TMDB
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