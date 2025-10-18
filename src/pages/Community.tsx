import { useState } from "react";
import { Film, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Mock data - em produção viria do banco de dados
const mockPosts = [
  {
    id: 1,
    description: "Filme de ação onde um policial fica preso em um prédio no Natal, lutando contra terroristas...",
    author: "João Silva",
    date: "Há 2 horas",
    answers: 3,
    likes: 12,
    solved: true,
    solution: "Duro de Matar (1988)"
  },
  {
    id: 2,
    description: "Animação sobre um chef de cozinha, mas o chef é na verdade um rato que controla um humano...",
    author: "Maria Santos",
    date: "Há 5 horas",
    answers: 5,
    likes: 8,
    solved: true,
    solution: "Ratatouille (2007)"
  },
  {
    id: 3,
    description: "Drama sobre um pianista que sonha em ser músico de jazz, mas a família quer que ele seja professor...",
    author: "Pedro Costa",
    date: "Há 1 dia",
    answers: 2,
    likes: 5,
    solved: false
  }
];

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const { toast } = useToast();

  const handleSubmitPost = () => {
    if (!newPost.trim()) {
      toast({
        title: "Campo vazio",
        description: "Descreva o filme que você está procurando.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pergunta publicada!",
      description: "A comunidade vai ajudar você a encontrar o filme.",
    });
    setNewPost("");
  };

  return (
    <div className="min-h-screen cinema-gradient">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Film className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              Scene<span className="text-primary">Memory</span>
            </h1>
          </Link>
          <nav className="flex gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/community" className="text-primary transition-colors">
              Comunidade
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Comunidade <span className="text-primary">SceneMemory</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Quando a IA não encontra, a comunidade resolve!
          </p>
        </div>

        {/* Create Post Section */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Peça ajuda à comunidade
            </CardTitle>
            <CardDescription>
              Descreva o filme que você está procurando e outros usuários vão te ajudar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descreva o filme que você lembra..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[120px] mb-4"
            />
            <Button onClick={handleSubmitPost} className="w-full">
              Publicar pergunta
            </Button>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold mb-6">Perguntas recentes</h3>
          
          {mockPosts.map((post) => (
            <Card key={post.id} className="border-border/50 hover:border-primary/30 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardDescription className="mb-2">
                      Por {post.author} • {post.date}
                    </CardDescription>
                    <p className="text-foreground leading-relaxed mb-3">
                      {post.description}
                    </p>
                    {post.solved && (
                      <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                        <Film className="w-4 h-4" />
                        Resolvido: {post.solution}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    {post.answers} respostas
                  </button>
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    {post.likes}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 SceneMemory - Lembrar de um filme nunca foi tão fácil</p>
        </div>
      </footer>
    </div>
  );
};

export default Community;
