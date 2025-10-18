import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Processando descrição:", description);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Você é um especialista em cinema com conhecimento enciclopédico sobre filmes de todas as épocas e gêneros. 
            
Sua tarefa é identificar filmes baseado em descrições de cenas, personagens, locais, época ou detalhes que o usuário lembrar.

Responda SEMPRE em formato JSON válido com um array "movies" contendo 2-4 filmes mais prováveis. Para cada filme inclua:
- title: título do filme em português (se tiver) ou original
- year: ano de lançamento
- description: breve sinopse (2-3 frases)
- confidence: "Alta", "Média" ou "Baixa"

Exemplo de resposta:
{
  "movies": [
    {
      "title": "Matrix",
      "year": "1999",
      "description": "Um hacker descobre que a realidade é uma simulação criada por máquinas. Com cenas icônicas de câmera lenta e artes marciais.",
      "confidence": "Alta"
    }
  ]
}

Se não tiver certeza, sugira filmes similares com confidence "Baixa" ou "Média".`
          },
          {
            role: "user",
            content: description
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API:", response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da IA:", data);
    
    const aiResponse = data.choices[0].message.content;
    
    // Parse da resposta JSON
    let movies;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        movies = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (parseError) {
      console.error("Erro ao parsear resposta:", parseError);
      // Resposta de fallback
      movies = {
        movies: [{
          title: "Não foi possível identificar",
          year: "N/A",
          description: "Tente descrever com mais detalhes: nomes de atores, ano aproximado, gênero do filme, etc.",
          confidence: "Baixa"
        }]
      };
    }

    return new Response(
      JSON.stringify(movies),
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
