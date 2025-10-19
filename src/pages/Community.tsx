import { useState, useMemo } from "react";
import { Film, MessageSquare, ThumbsUp, Send, Search, Filter, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type Post = {
  id: string;
  description: string;
  created_at: string;
  is_solved: boolean;
  solution: string | null;
  user_id: string;
  likes: { user_id: string }[];
  replies: { count: number }[];
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

const fetchPosts = async (userId?: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      description,
      created_at,
      is_solved,
      solution,
      user_id,
      likes(user_id),
      replies(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching posts:", error);
    throw new Error(error.message);
  }
  return data as unknown as Post[];
};

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_liked" | "most_replied">("newest");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading, error } = useQuery({
    queryKey: ["community_posts", user?.id],
    queryFn: () => fetchPosts(user?.id),
  });

  // Filtrar e ordenar posts
  const filteredAndSortedPosts = useMemo(() => {
    if (!posts) return [];

    let filtered = posts.filter(post => {
      // Filtro por status
      if (statusFilter === "solved" && !post.is_solved) return false;
      if (statusFilter === "unsolved" && post.is_solved) return false;

      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return post.description.toLowerCase().includes(searchLower) ||
               post.profiles?.username?.toLowerCase().includes(searchLower);
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most_liked":
          return b.likes.length - a.likes.length;
        case "most_replied":
          return (b.replies[0]?.count || 0) - (a.replies[0]?.count || 0);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [posts, searchTerm, statusFilter, sortBy]);

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

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Você precisa estar logado para curtir.");
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const markAsSolvedMutation = useMutation({
    mutationFn: async ({ postId, solution }: { postId: string; solution: string }) => {
      if (!user) throw new Error("Você precisa estar logado.");
      const { error } = await supabase
        .from('posts')
        .update({ is_solved: true, solution })
        .eq('id', postId)
        .eq('user_id', user.id); // Só o autor pode marcar como resolvido
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      toast({ title: "Post marcado como resolvido!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmitPost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const getUserDisplayName = (post: Post) => {
    return post.profiles?.username || "Usuário Anônimo";
  };

  const getUserInitials = (post: Post) => {
    const name = getUserDisplayName(post);
    return name === "Usuário Anônimo" ? "?" : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen cinema-gradient">
      <Header />
      <PostDetailsDialog post={viewingPost} onOpenChange={() => setViewingPost(null)} />

      <div className="container mx-auto px-4 py-16 max-w-7xl">
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
            <Textarea 
              placeholder="Descreva o filme que você lembra..." 
              value={newPost} 
              onChange={(e) => setNewPost(e.target.value)} 
              className="min-h-[120px] mb-4 resize-none bg-background/50 border-white/10 focus:border-primary/50 rounded-xl transition-all duration-300" 
              disabled={!user || createPostMutation.isPending} 
            />
            <Button onClick={handleSubmitPost} className="w-full gold-glow rounded-xl font-semibold tracking-wide" disabled={!user || createPostMutation.isPending || !newPost.trim()}>
              {createPostMutation.isPending ? "Publicando..." : <><Send className="w-4 h-4 mr-2" />Publicar pergunta</>}
            </Button>
          </CardContent>
        </Card>

        {/* Filtros e Busca */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar perguntas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-40 bg-background/50 border-white/10 rounded-xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unsolved">Não resolvidos</SelectItem>
                    <SelectItem value="solved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48 bg-background/50 border-white/10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigos</SelectItem>
                    <SelectItem value="most_liked">Mais curtidos</SelectItem>
                    <SelectItem value="most_replied">Mais respondidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Perguntas da comunidade</h3>
            <Badge variant="secondary" className="text-sm">
              {filteredAndSortedPosts.length} {filteredAndSortedPosts.length === 1 ? 'pergunta' : 'perguntas'}
            </Badge>
          </div>

          {postsLoading || authLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
          ) : error ? (
            <p className="text-destructive text-center">Erro ao carregar as perguntas.</p>
          ) : filteredAndSortedPosts.length > 0 ? (
            filteredAndSortedPosts.map((post) => {
              const isLiked = user ? post.likes.some(like => like.user_id === user.id) : false;
              const isAuthor = user?.id === post.user_id;
              return (
                <Card key={post.id} className="glass-card border-gradient card-hover overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials(post)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{getUserDisplayName(post)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.is_solved && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolvido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-foreground/90 leading-relaxed mb-4 text-[15px]">
                      {post.description}
                    </p>
                    {post.is_solved && post.solution && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">Solução aceita</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{post.solution}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2 hover:text-primary transition-colors" 
                          onClick={() => setViewingPost(post)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {post.replies[0]?.count || 0} {post.replies[0]?.count === 1 ? 'resposta' : 'respostas'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn("flex items-center gap-2 hover:text-primary transition-colors", isLiked && "text-primary")} 
                          onClick={() => user && toggleLikeMutation.mutate({ postId: post.id, isLiked })} 
                          disabled={!user || toggleLikeMutation.isPending}
                        >
                          <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
                          {post.likes.length}
                        </Button>
                      </div>
                      {isAuthor && !post.is_solved && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const solution = prompt("Digite a solução encontrada:");
                            if (solution?.trim()) {
                              markAsSolvedMutation.mutate({ postId: post.id, solution: solution.trim() });
                            }
                          }}
                          className="text-xs"
                        >
                          Marcar como resolvido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16">
              <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                {searchTerm || statusFilter !== "all" ? "Nenhuma pergunta encontrada com os filtros aplicados." : "Nenhuma pergunta por aqui ainda."}
              </p>
              <p className="text-muted-foreground/70">
                {searchTerm || statusFilter !== "all" ? "Tente ajustar os filtros ou a busca." : "Seja o primeiro a postar uma pergunta!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;