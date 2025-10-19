import { useState } from "react";
import { Film, MessageSquare, ThumbsUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Post = {
  id: string;
  description: string;
  created_at: string;
  is_solved: boolean;
  solution: string | null;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: { count: number }[];
  replies: { count: number }[];
};

const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      description,
      created_at,
      is_solved,
      solution,
      user_id,
      profiles:profiles!user_id(username, avatar_url),
      likes(count),
      replies(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching posts:", error);
    throw new Error(error.message);
  }
  // Supabase returns an array for the joined item, so we flatten it.
  const formattedData = data?.map(post => ({
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
  }));
  
  return formattedData as Post[];
};

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading, error } = useQuery({
    queryKey: ["community_posts"],
    queryFn: fetchPosts,
  });

  const createPostMutation = useMutation({
    mutationFn: async (description: string) => {
      if (!user) throw new Error("Você precisa estar logado para postar.");
      const { error } = await supabase.from("posts").insert([{ description, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      setNewPost("");
      toast({
        title: "Pergunta publicada!",
        description: "A comunidade vai ajudar você a encontrar o filme.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao publicar",
        description: err.message || "Não foi possível publicar sua pergunta.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitPost = () => {
    if (!newPost.trim()) {
      toast({
        title: "Campo vazio",
        description: "Descreva o filme que você está procurando.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(newPost);
  };

  return (
    <div className="min-h-screen cinema-gradient">
      <Header />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
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

        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Peça ajuda à comunidade
            </CardTitle>
            <CardDescription>
              {user ? "Descreva o filme que você está procurando e outros usuários vão te ajudar." : "Faça login para publicar uma pergunta e ajudar outros usuários."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descreva o filme que você lembra..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[120px] mb-4"
              disabled={!user || createPostMutation.isPending}
            />
            <Button 
              onClick={handleSubmitPost} 
              className="w-full"
              disabled={!user || createPostMutation.isPending || !newPost.trim()}
            >
              {createPostMutation.isPending ? "Publicando..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publicar pergunta
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold mb-6">Perguntas recentes</h3>
          
          {postsLoading || authLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/50 p-6">
                <CardHeader>
                  <Skeleton className="h-4 w-[250px] mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-[80%] mb-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-6 w-[60px]" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <p className="text-destructive text-center">Erro ao carregar as perguntas.</p>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="border-border/50 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardDescription className="mb-2">
                        Por {post.profiles?.username || 'Usuário anônimo'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </CardDescription>
                      <p className="text-foreground leading-relaxed mb-3">
                        {post.description}
                      </p>
                      {post.is_solved && (
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
                      {post.replies[0]?.count || 0} respostas
                    </button>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      {post.likes[0]?.count || 0}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma pergunta por aqui ainda. Seja o primeiro a postar!</p>
          )}
        </div>
      </div>

      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 SceneMemory - Lembrar de um filme nunca foi tão fácil</p>
        </div>
      </footer>
    </div>
  );
};

export default Community;