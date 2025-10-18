import { useState } from "react";
import { Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MovieResults from "@/components/MovieResults";
import HeroSection from "@/components/HeroSection";
import { Link } from "react-router-dom";

const Index = () => {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!description.trim()) {
      toast({
        title: "Campo vazio",
        description: "Por favor, descreva a cena que você lembra.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("identify-movie", {
        body: { description },
      });

      if (error) throw error;
      
      // A função pode retornar um erro dentro do corpo de dados em caso de falha controlada
      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data.movies || []);
      
      if (!data.movies || data.movies.length === 0) {
        toast({
          title: "Nenhum filme encontrado",
          description: "Tente descrever com mais detalhes ou use palavras-chave diferentes.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao invocar a função:", error);
      let errorMessage = "Não foi possível processar sua solicitação. Tente novamente.";
      
      // Prioriza a mensagem de erro vinda diretamente da função
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na busca",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen cinema-gradient">
      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Film className="w-8 h-8 text-primary group-hover:rotate-12 transition-all duration-300" />
              <div className="absolute inset-0 blur-xl bg-primary/20 group-hover:bg-primary/40 transition-all duration-300"></div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
              Scene<span className="text-gradient">Memory</span>
            </h1>
          </Link>
          <nav className="flex gap-8">
            <Link to="/" className="text-foreground/90 hover:text-primary transition-all duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300">
              Início
            </Link>
            <Link to="/community" className="text-foreground/90 hover:text-primary transition-all duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300">
              Comunidade
            </Link>
          </nav>
        </div>
      </header>

      <HeroSection />

      {/* Main Search Section */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="glass-card border-gradient rounded-2xl p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Descreva a cena que você lembra
            </h2>
          </div>
          
          <Textarea
            placeholder="Ex: Um homem de terno preto lutando em um prédio, tinha cenas de câmera lenta e muita ação. Acho que era dos anos 90 ou 2000..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[160px] mb-6 text-base resize-none bg-background/50 border-white/10 focus:border-primary/50 rounded-xl transition-all duration-300"
          />
          
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full text-lg py-7 gold-glow rounded-xl font-semibold tracking-wide"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <span className="animate-spin">⏳</span>
                <span>Procurando...</span>
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Film className="w-5 h-5" />
                <span>Descobrir o Filme</span>
              </span>
            )}
          </Button>
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <MovieResults movies={results} />
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 SceneMemory - Lembrar de um filme nunca foi tão fácil</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;