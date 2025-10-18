import { Film } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-24 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="max-w-3xl mx-auto relative">
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl backdrop-blur-sm">
            <Film className="w-20 h-20 text-primary animate-pulse" />
            <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-3xl animate-pulse"></div>
          </div>
        </div>
        
        <h2 
          className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in"
          style={{ fontFamily: "'Cinzel', serif", animationDelay: "0.1s" }}
        >
          Lembrar de um filme<br />
          <span className="text-gradient">nunca foi tão fácil</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-muted-foreground/90 leading-relaxed font-light animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Descreva aquela cena marcante, personagem ou detalhe que ficou na sua memória.<br />
          <span className="text-foreground/70">Nossa IA avançada identifica o filme para você em segundos.</span>
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
