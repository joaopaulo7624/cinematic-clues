import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Post = {
  id: string;
  description: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type Reply = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

const fetchReplies = async (postId: string) => {
  const { data, error } = await supabase
    .from('replies')
    .select('id, content, created_at, user_id, profiles!inner(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as unknown as Reply[];
};

const PostDetailsDialog = ({ post, onOpenChange }: { post: Post | null; onOpenChange: (open: boolean) => void }) => {
  const [newReply, setNewReply] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ['replies', post?.id],
    queryFn: () => fetchReplies(post!.id),
    enabled: !!post,
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !post) throw new Error('Ação inválida.');
      const { error } = await supabase.from('replies').insert([{ content, post_id: post.id, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', post?.id] });
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
      setNewReply('');
      toast({ title: 'Resposta enviada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  const handleReplySubmit = () => {
    if (!newReply.trim()) return;
    createReplyMutation.mutate(newReply);
  };

  return (
    <Dialog open={!!post} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Pergunta de {post?.profiles?.username || 'Usuário'}</DialogTitle>
          <DialogDescription className="pt-2">{post?.description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
          {repliesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            replies?.map((reply) => (
              <div key={reply.id} className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{reply.profiles?.username || 'Usuário anônimo'}</span>
                  <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            ))
          )}
        </div>
        {user && (
          <div className="flex gap-2 pt-4">
            <Textarea
              placeholder="Escreva sua resposta..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              disabled={createReplyMutation.isPending}
            />
            <Button onClick={handleReplySubmit} disabled={createReplyMutation.isPending || !newReply.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailsDialog;