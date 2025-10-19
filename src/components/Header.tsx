import { Link, useNavigate } from "react-router-dom";
import { Film, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return "?";
    return email.substring(0, 2).toUpperCase();
  };

  return (
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
        <div className="flex items-center gap-8">
          <nav className="flex gap-8">
            <Link to="/" className="text-foreground/90 hover:text-primary transition-all duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300">
              Início
            </Link>
            <Link to="/community" className="text-foreground/90 hover:text-primary transition-all duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300">
              Comunidade
            </Link>
          </nav>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata.avatar_url} alt="Avatar" />
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Minha Conta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")} variant="outline" className="rounded-xl">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;