import { supabase } from '@/integrations/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Film } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/community');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen cinema-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Film className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
              Scene<span className="text-gradient">Memory</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Faça login para participar da comunidade</p>
        </div>
        <div className="glass-card border-gradient rounded-2xl p-8 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'github']}
            theme="dark"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu email',
                  password_label: 'Sua senha',
                  button_label: 'Entrar',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre',
                },
                sign_up: {
                  email_label: 'Seu email',
                  password_label: 'Sua senha',
                  button_label: 'Registrar',
                  social_provider_text: 'Registrar com {{provider}}',
                  link_text: 'Não tem uma conta? Registre-se',
                },
                forgotten_password: {
                  email_label: 'Seu email',
                  button_label: 'Enviar instruções',
                  link_text: 'Esqueceu sua senha?',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;