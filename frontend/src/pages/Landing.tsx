import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Users, Scissors, BarChart3, Shield, Zap, ChevronRight, Star, Quote } from "lucide-react";
import salonBg from "@/assets/salon-hero-bg.jpg";

const features = [
  { icon: Calendar, title: "Agenda Inteligente", description: "Gerencie agendamentos com facilidade. Status em tempo real e notificações automáticas." },
  { icon: Users, title: "Gestão de Clientes", description: "Histórico completo de atendimentos, preferências e fidelização." },
  { icon: Scissors, title: "Serviços & Comissões", description: "Cadastre serviços, defina preços e calcule comissões automaticamente." },
  { icon: BarChart3, title: "Financeiro Completo", description: "Receitas, despesas, caixa e relatórios detalhados por período." },
  { icon: Shield, title: "Multi-Tenant Seguro", description: "Cada salão com seus dados isolados. Segurança total entre empresas." },
  { icon: Zap, title: "Performance", description: "Sistema rápido com cache inteligente e processamento otimizado." },
];

const testimonials = [
  {
    name: "Ana Cristina",
    role: "Proprietária — Salão Beleza Pura, Luanda",
    avatar: "AC",
    text: "Desde que comecei a usar o GenOmni Salon, a gestão do meu salão ficou muito mais organizada. As comissões são calculadas automaticamente e o controle financeiro é impecável!",
    rating: 5,
  },
  {
    name: "Fernando Gomes",
    role: "Gerente — Barbearia Estilo, Benguela",
    avatar: "FG",
    text: "O sistema é muito intuitivo. Conseguimos agendar clientes, controlar o estoque e ver os relatórios de faturamento tudo num só lugar. Recomendo muito!",
    rating: 5,
  },
  {
    name: "Maria do Rosário",
    role: "Proprietária — Studio MR Beauty, Viana",
    avatar: "MR",
    text: "A funcionalidade de notificações de estoque baixo salvou-nos várias vezes. Agora nunca ficamos sem produtos importantes. A equipa de suporte também é excelente!",
    rating: 5,
  },
  {
    name: "João Pedro",
    role: "Proprietário — JP Barber Shop, Talatona",
    avatar: "JP",
    text: "O melhor investimento que fiz para o meu negócio. O Multicaixa Express integrado facilita muito os pagamentos e os clientes adoram a praticidade.",
    rating: 4,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold text-foreground">GenOmni Salon</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Cadastrar Empresa</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img src={salonBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
            <Star className="h-3.5 w-3.5" />
            Plataforma SaaS para Salões de Beleza
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Gerencie seu salão com
          </h1>
          <p className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-6 animate-fade-in" style={{
            animationDelay: "0.15s",
            background: "linear-gradient(135deg, hsl(350, 65%, 52%) 0%, hsl(35, 80%, 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            elegância e eficiência
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Tudo o que você precisa para administrar seu negócio: agenda, financeiro, estoque, clientes e muito mais — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" asChild className="text-base">
              <Link to="/register">
                Começar Agora <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-4">
            Tudo que seu salão precisa
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Módulos completos para gerenciar cada aspecto do seu negócio
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-card rounded-lg p-6 shadow-card hover:shadow-soft transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-4">
            O que dizem nossos clientes
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Salões em toda Angola já confiam no GenOmni Salon para gerir o seu negócio
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-soft transition-all duration-300 animate-fade-in relative"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`h-4 w-4 ${si < t.rating ? "text-accent fill-accent" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Pronto para transformar seu salão?
          </h2>
          <p className="text-muted-foreground mb-8">
            Cadastre sua empresa agora e comece a usar todos os recursos.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Cadastrar Empresa</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Scissors className="h-4 w-4 text-primary" />
            <span className="font-serif font-semibold text-foreground">GenOmni Salon</span>
          </div>
          <p>© 2026 GenOmni Salon. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
