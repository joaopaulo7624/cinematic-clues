import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.').max(50, 'O nome de usuário não pode ter mais de 50 caracteres.'),
});

const passwordFormSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user,
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ username: profile.username || '' });
    }
  }, [profile, profileForm]);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileFormSchema>) => {
      if (!user) throw new Error('Usuário não encontrado.');
      const { error } = await supabase.from('profiles').update({ username: values.username, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Sucesso!', description: 'Seu nome de usuário foi atualizado.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordFormSchema>) => {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: 'Sucesso!', description: 'Sua senha foi atualizada.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen cinema-gradient">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cinema-gradient">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-2xl space-y-12">
        <div>
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Cinzel', serif" }}>
            Meu Perfil
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Editar Nome de Usuário</CardTitle>
              <CardDescription>Este nome será exibido para outros usuários na comunidade.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome de usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;