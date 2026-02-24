import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Zap, Bot, Image, Share2, BarChart3, MessageSquare, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "IA Generativa",
    desc: "Claude e ChatGPT criam estratégias completas e cópias para cada canal automaticamente.",
    color: "text-primary bg-primary/15",
  },
  {
    icon: MessageSquare,
    title: "Chatbot WhatsApp",
    desc: "Clientes solicitam campanhas diretamente pelo WhatsApp. O bot entende e cria tudo.",
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15",
  },
  {
    icon: Image,
    title: "Criativos Automáticos",
    desc: "Integração com Freepik para gerar imagens e criativos visuais baseados na estratégia.",
    color: "text-indigo-700 dark:text-indigo-300 bg-indigo-500/15",
  },
  {
    icon: Share2,
    title: "Publicação Automática",
    desc: "Publique em Instagram, Facebook, TikTok e LinkedIn com um clique ou automaticamente.",
    color: "text-sky-700 dark:text-sky-300 bg-sky-500/15",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    desc: "Acompanhe todas as campanhas, métricas e status em tempo real.",
    color: "text-amber-700 dark:text-amber-300 bg-amber-500/15",
  },
  {
    icon: Zap,
    title: "Dados Pré-definidos",
    desc: "Configure tom de voz, público-alvo e identidade visual por cliente. A IA usa tudo.",
    color: "text-orange-700 dark:text-orange-300 bg-orange-500/15",
  },
];

const workflow = [
  { step: "01", title: "Cliente solicita via WhatsApp", desc: "Mensagem simples como 'Quero uma campanha de lançamento'" },
  { step: "02", title: "IA busca dados do cliente", desc: "Tom de voz, público-alvo, produtos e identidade visual pré-configurados" },
  { step: "03", title: "Estratégia gerada em segundos", desc: "Claude cria estratégia completa, cópias para cada canal e sugestão de criativo" },
  { step: "04", title: "Revisão e aprovação", desc: "Você revisa, aprova e agenda a publicação com um clique" },
  { step: "05", title: "Publicação automática", desc: "Posts publicados automaticamente no Instagram, Facebook, TikTok e LinkedIn" },
];

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 px-4 py-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg font-['Space_Grotesk']">AdFlow</span>
          </div>
          <Button onClick={() => navigate("/login")}>
            Entrar na Plataforma <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-cyan-500/6 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Agência de Marketing com IA Completa
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-['Space_Grotesk'] leading-tight mb-6">
            Campanhas completas
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">geradas por IA</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Solicite campanhas via WhatsApp e receba estratégia, cópias e criativos prontos para publicação em todos os canais — automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="text-base px-8" onClick={() => navigate("/login")}>
              <Zap className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-3">Tudo automatizado, nada manual</h2>
            <p className="text-muted-foreground">Do pedido do cliente à publicação nas redes sociais, sem intervenção humana.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="como-funciona" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-3">Como funciona</h2>
            <p className="text-muted-foreground">5 passos do pedido à publicação</p>
          </div>
          <div className="space-y-4">
            {workflow.map(({ step, title, desc }, i) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{title}</h3>
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Pronto para automatizar sua agência?</h2>
          <p className="text-muted-foreground mb-8">Configure seus clientes, conecte as APIs e comece a gerar campanhas em minutos.</p>
          <Button size="lg" className="text-base px-10" onClick={() => navigate("/login")}>
            <Zap className="w-5 h-5 mr-2" />
            Acessar Plataforma
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-6 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span>AdFlow — Marketing Automation SaaS</span>
          </div>
          <p>Powered by Claude AI + Freepik + WhatsApp API</p>
        </div>
      </footer>
    </div>
  );
}
