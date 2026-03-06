import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Zap, Calendar, Wallet, BarChart3, ArrowRight, CheckCircle, Users, Target, BookOpen, Star } from "lucide-react";
import { getStartPageRoute } from "@/lib/user-settings";
import { PLAN_CARDS, getPlanCheckoutIntentUrl } from "@/lib/planCatalog";

const features = [
  {
    icon: Calendar,
    title: "Rotina Integrada",
    desc: "Gerencie tarefas, hábitos, pomodoro e agenda em uma visão diária clara e prática.",
    color: "text-primary bg-primary/15",
  },
  {
    icon: Target,
    title: "CRM e Prospecção",
    desc: "Organize leads por estágio e acompanhe metas diárias de prospecção em tempo real.",
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15",
  },
  {
    icon: Wallet,
    title: "Financeiro CPF e CNPJ",
    desc: "Controle lançamentos, recorrências e comprovantes com visão completa de saldo e categorias.",
    color: "text-indigo-700 dark:text-indigo-300 bg-indigo-500/15",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    desc: "Cadastre clientes, mantenha dados centralizados e acompanhe o relacionamento sem planilhas.",
    color: "text-sky-700 dark:text-sky-300 bg-sky-500/15",
  },
  {
    icon: BarChart3,
    title: "Dashboard Personalizável",
    desc: "Monte o painel com os widgets que importam para sua operação e seu foco do dia.",
    color: "text-amber-700 dark:text-amber-300 bg-amber-500/15",
  },
  {
    icon: Target,
    title: "Configuração por Perfil",
    desc: "Ajuste metas, preferências e aparência para deixar o Orbita adaptado ao seu ritmo.",
    color: "text-orange-700 dark:text-orange-300 bg-orange-500/15",
  },
  {
    icon: BookOpen,
    title: "Diário e Sonhos",
    desc: "Registre reflexões no diário e mantenha seu quadro de sonhos ativo dentro da rotina.",
    color: "text-violet-700 dark:text-violet-300 bg-violet-500/15",
  },
  {
    icon: Star,
    title: "Foco no Essencial",
    desc: "Interface enxuta com os módulos úteis no dia a dia, sem áreas que ainda não estão prontas.",
    color: "text-cyan-700 dark:text-cyan-300 bg-cyan-500/15",
  },
];

const workflow = [
  { step: "01", title: "Cadastre seus clientes", desc: "Centralize informações de contato e contexto comercial." },
  { step: "02", title: "Estruture sua rotina", desc: "Defina tarefas, hábitos e prioridades para o dia." },
  { step: "03", title: "Acompanhe o CRM", desc: "Mova leads no funil e execute follow-up no momento certo." },
  { step: "04", title: "Controle o financeiro", desc: "Registre entradas e saídas de CPF/CNPJ em um só fluxo." },
  { step: "05", title: "Ajuste e repita", desc: "Personalize o painel e as metas para manter constância de execução." },
];

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getStartPageRoute());
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
            <span className="font-bold text-lg font-['Space_Grotesk']">Orbita</span>
          </div>
          <Button
            onClick={() =>
              document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ver Planos <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-cyan-500/6 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Módulos ativos hoje no Orbita
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-['Space_Grotesk'] leading-tight mb-6">
            Rotina, clientes e financeiro
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">no mesmo painel</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Hoje o app entrega: Dashboard, Clientes, Rotina, Agenda, CRM, Prospecção, Financeiro, Diário, Quadro dos Sonhos e Configurações.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="text-base px-8"
              onClick={() =>
                document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Zap className="w-5 h-5 mr-2" />
              Escolher Meu Plano
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              onClick={() => navigate("/login")}
            >
              Já Tenho Conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-3">Funcionalidades já disponíveis</h2>
            <p className="text-muted-foreground">Tudo abaixo já está funcionando na versão atual.</p>
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

      <section id="planos" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-3">Escolha seu plano antes de entrar</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A pessoa escolhe o plano aqui, cria a conta e segue direto para o pagamento antes de acessar a plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_CARDS.map((plan) => (
              <div
                key={plan.id}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm shadow-black/5"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-emerald-400" />
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    {plan.id.startsWith("business") ? "Business" : "Pessoal"}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold font-['Space_Grotesk']">{plan.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground min-h-10">{plan.audience}</p>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold font-['Space_Grotesk']">{plan.monthlyPrice}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cadastro rapido + checkout Kiwify + acesso liberado depois do pagamento.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(getPlanCheckoutIntentUrl(plan.id))}
                >
                  Escolher {plan.label}
                </Button>
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
            <p className="text-muted-foreground">5 passos para operar com constância</p>
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
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Pronto para contratar a Orbita?</h2>
          <p className="text-muted-foreground mb-8">
            Escolha um plano, crie sua conta e siga direto para o pagamento.
          </p>
          <Button
            size="lg"
            className="text-base px-10"
            onClick={() =>
              document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Zap className="w-5 h-5 mr-2" />
            Ver Planos Agora
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
            <span>Orbita — Sistema Operacional da Rotina</span>
          </div>
          <p>Planejamento, execução e acompanhamento no mesmo lugar.</p>
        </div>
      </footer>
    </div>
  );
}
