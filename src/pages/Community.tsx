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
import PostDetailsDialog from "@/components/PostDetailsDialog";
import { cn } from "@/lib/utils";

// Simplificando o tipo para corresponder à consulta simplificada
type Post = {
  id: string;
  description: string;
  created_at: string;
  is_solved: boolean;
  solution: string | null;
  user_id: string;
};

// Consulta extremamente simplificada para testar a conexão
const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select("id, description, created_at, is_solved, solution, user_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching posts:", error);
    throw new Error(error.message);
  }
  return data;
};

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
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
      toast({ title: "Pergunta publicada!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmitPost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  return (
    <div className="min-h-screen cinema-gradient">
      <Header />
      {/* PostDetailsDialog está desativado por enquanto */}
      {/* <PostDetailsDialog post={viewingPost} onOpenChange={() => setViewingPost(null)} /> */}

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            Comunidade <span className="text-primary">SceneMemory</span>
          </h2>
          <p className="text-xl text-muted-foreground">Quando a IA não encontra, a comunidade resolve!</p>
        </div>

        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />Peça ajuda à comunidade</CardTitle>
            <CardDescription>{user ? "Descreva o filme que você está procurando." : "Faça login para publicar uma pergunta."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Descreva o filme que você lembra..." value={newPost} onChange={(e) => setNewPost(e.target.value)} className="min-h-[120px] mb-4" disabled={!user || createPostMutation.isPending} />
            <Button onClick={handleSubmitPost} className="w-full" disabled={!user || createPostMutation.isPending || !newPost.trim()}>
              {createPostMutation.isPending ? "Publicando..." : <><Send className="w-4 h-4 mr-2" />Publicar pergunta</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold mb-6">Perguntas recentes</h3>
          {postsLoading || authLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
          ) : error ? (
            <p className="text-destructive text-center">Erro ao carregar as perguntas: {error.message}</p>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="border-border/50 hover:border-primary/30 transition-all">
                <CardHeader>
                  <CardDescription className="mb-2">Por Usuário Anônimo • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</CardDescription>
                  <p className="text-foreground leading-relaxed mb-3">{post.description}</p>
                  {post.is_solved && <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"><Film className="w-4 h-4" />Resolvido: {post.solution}</div>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="text-muted-foreground">Funcionalidades de curtir e responder desativadas temporariamente.</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma pergunta por aqui ainda. Seja o primeiro a postar!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;