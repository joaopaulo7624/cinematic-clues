import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Movie {
  title: string;
  year: string;
  description: string;
  confidence: string;
}

interface MovieResultsProps {
  movies: Movie[];
}

const MovieResults = ({ movies }: MovieResultsProps) => {
  const [feedback, setFeedback] = useState<{ [key: string]: boolean | null }>({});
  const { toast } = useToast();

  const handleFeedback = (movieTitle: string, isCorrect: boolean) => {
    setFeedback({ ...feedback, [movieTitle]: isCorrect });
    toast({
      title: isCorrect ? "Obrigado!" : "Entendido",
      description: isCorrect 
        ? "Seu feedback nos ajuda a melhorar." 
        : "Vamos usar isso para aprender mais.",
    });
  };

  return (
    <section className="container mx-auto px-4 pb-20 max-w-6xl animate-fade-in">
      <h3 className="text-4xl font-bold mb-12 text-center" style={{ fontFamily: "'Cinzel', serif" }}>
        Possíveis <span className="text-gradient">resultados</span>
      </h3>
      
      <div className="grid md:grid-cols-2 gap-8">
        {movies.map((movie, index) => (
          <Card 
            key={index} 
            className="glass-card border-gradient card-hover overflow-hidden group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-3 group-hover:text-gradient transition-all duration-300" style={{ fontFamily: "'Cinzel', serif" }}>
                    {movie.title}
                  </CardTitle>
                  <CardDescription className="text-base flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
                      {movie.year}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      movie.confidence === "Alta" 
                        ? "bg-green-500/10 text-green-500" 
                        : movie.confidence === "Média"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {movie.confidence}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground/90 mb-6 leading-relaxed text-[15px]">
                {movie.description}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant={feedback[movie.title] === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFeedback(movie.title, true)}
                  className="flex-1 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  É esse!
                </Button>
                <Button
                  variant={feedback[movie.title] === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleFeedback(movie.title, false)}
                  className="flex-1 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Não é
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default MovieResults;
