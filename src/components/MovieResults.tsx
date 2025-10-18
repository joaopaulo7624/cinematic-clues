import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Movie {
  title: string;
  year: string;
  description: string;
  confidence: string;
  poster_path: string | null;
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

  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

  return (
    <section className="container mx-auto px-4 pb-20 max-w-6xl animate-fade-in">
      <h3 className="text-4xl font-bold mb-12 text-center" style={{ fontFamily: "'Cinzel', serif" }}>
        Possíveis <span className="text-gradient">resultados</span>
      </h3>
      
      <div className="grid md:grid-cols-2 gap-8">
        {movies.map((movie, index) => (
          <Card 
            key={index} 
            className="glass-card border-gradient card-hover overflow-hidden group flex flex-col"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="w-full">
              <AspectRatio ratio={2 / 3}>
                <img
                  src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : "/placeholder.svg"}
                  alt={`Pôster do filme ${movie.title}`}
                  className="rounded-t-xl object-cover w-full h-full"
                />
              </AspectRatio>
            </div>
            <div className="flex flex-col flex-grow p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-3 group-hover:text-gradient transition-all duration-300" style={{ fontFamily: "'Cinzel', serif" }}>
                      {movie.title}
                    </CardTitle>
                    <CardDescription className="text-base flex items-center gap-2 flex-wrap">
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
              <CardContent className="p-0 flex-grow">
                <p className="text-muted-foreground/90 mb-6 leading-relaxed text-[15px]">
                  {movie.description}
                </p>
              </CardContent>
              <div className="flex gap-3 mt-auto">
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
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default MovieResults;