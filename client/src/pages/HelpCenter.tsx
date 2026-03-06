import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Contact,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
  Target,
  Wallet,
  Users,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getOnboardingSteps,
  getNextOnboardingStep,
  getOnboardingProgress,
  getOnboardingState,
  requestOnboardingReopen,
} from "@/lib/onboarding";
import { canUseFeature, type OrbitaPlan, type OrbitaPlanStatus } from "@shared/planAccess";

type PlanAccessParams = {
  plan: OrbitaPlan | null;
  planStatus: OrbitaPlanStatus | null;
  planExpiry: Date | string | null;
};

const HELP_AREAS = [
  {
    title: "Dashboard",
    description: "Leia sua operação do dia e personalize os widgets que importam para você.",
    icon: LayoutDashboard,
    href: "/dashboard",
    bullets: ["Resumo geral", "Widgets personalizáveis", "Ações rápidas"],
    available: () => true,
  },
  {
    title: "Clientes",
    description: "Cadastre clientes, acompanhe histórico e centralize contexto comercial.",
    icon: Users,
    href: "/clients",
    bullets: ["Cadastro rápido", "Detalhes do cliente", "Base organizada"],
    available: (params: PlanAccessParams) =>
      canUseFeature({ ...params, feature: "clients" }),
  },
  {
    title: "Minha Rotina",
    description: "Organize tarefas, hábitos e ciclos de foco para sair do planejamento para execução.",
    icon: Target,
    href: "/routine",
    bullets: ["Tarefas do dia", "Hábitos", "Pomodoro"],
    available: () => true,
  },
  {
    title: "Agenda e diário",
    description: "Concentre compromissos, contexto do dia e anotações recorrentes em um único fluxo.",
    icon: Calendar,
    href: "/agenda",
    bullets: ["Compromissos", "Visão semanal", "Contexto diário"],
    available: () => true,
  },
  {
    title: "CRM / Leads",
    description: "Acompanhe o funil e mantenha follow-ups em dia para não perder oportunidades.",
    icon: Contact,
    href: "/crm",
    bullets: ["Estágios do funil", "Leads", "Próximas ações"],
    available: (params: PlanAccessParams) =>
      canUseFeature({ ...params, feature: "crm" }),
  },
  {
    title: "Financeiro",
    description: "Controle entradas, saídas e recorrências com visão clara do mês.",
    icon: Wallet,
    href: "/financeiro",
    bullets: ["Resumo do mês", "Lançamentos", "Recorrências"],
    available: () => true,
  },
  {
    title: "Configurações e planos",
    description: "Ajuste preferências, revise seu plano e mantenha a conta alinhada ao seu momento.",
    icon: Settings,
    href: "/settings",
    bullets: ["Conta", "Segurança", "Planos"],
    available: () => true,
  },
] as const;

export default function HelpCenter() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const steps = getOnboardingSteps(user?.plan ?? null);
  const onboardingState = getOnboardingState(user?.openId);
  const nextStep = getNextOnboardingStep(user?.openId, user?.plan ?? null);
  const progress = getOnboardingProgress(onboardingState, user?.plan ?? null);
  const completedSteps = steps.filter((step) => onboardingState.completedStepIds.includes(step.id)).length;

  const areas = useMemo(
    () =>
      HELP_AREAS.map((area) => ({
        ...area,
        enabled: area.available({
          plan: user?.plan ?? null,
          planStatus: user?.planStatus ?? null,
          planExpiry: user?.planExpiry ?? null,
        }),
      })),
    [user?.plan, user?.planExpiry, user?.planStatus],
  );

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Suporte guiado</p>
            <h1 className="page-title">Central de ajuda</h1>
            <p className="page-subtitle">Atalhos práticos para entender cada módulo sem depender de memória.</p>
          </div>
        </div>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-sky-500/10">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 text-primary">Sprint 1 atual</Badge>
                <Badge variant="outline">Onboarding e ajuda</Badge>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Primeiros passos guiados</h2>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  O objetivo aqui é simples: deixar claro qual módulo abrir primeiro, qual resultado esperar e
                  como retomar o contexto se o fluxo for interrompido.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Checklist</p>
                  <p className="mt-2 text-2xl font-semibold">{completedSteps}/{steps.length}</p>
                  <p className="text-xs text-muted-foreground">passos concluídos</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximo passo</p>
                  <p className="mt-2 text-sm font-semibold">{nextStep?.title ?? "Checklist concluído"}</p>
                  <p className="text-xs text-muted-foreground">{nextStep?.description ?? "Pode seguir com o uso diário."}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ação recomendada</p>
                  <p className="mt-2 text-sm font-semibold">Voltar ao tutorial</p>
                  <p className="text-xs text-muted-foreground">Reabre o passo a passo no dashboard sem apagar progresso.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  onClick={() => {
                    requestOnboardingReopen(user?.openId);
                    navigate("/dashboard");
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Reabrir tutorial
                </Button>
                {nextStep ? (
                  <Button variant="outline" className="gap-2" asChild>
                    <Link href={nextStep.path}>
                      Abrir próximo módulo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Como usar esta central
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                1. Veja o próximo passo recomendado.
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                2. Abra o módulo correspondente e execute a ação mínima.
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                3. Se travar, volte aqui e use os atalhos por funcionalidade.
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                4. Se o módulo for Business e seu plano for pessoal, a recomendação é subir o plano antes de insistir.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const Icon = area.icon;
            return (
              <Card key={area.title} className="border-border">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={area.enabled ? "outline" : "secondary"}>
                      {area.enabled ? "Disponível" : "Requer plano Business"}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-base">{area.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {area.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                  {area.enabled ? (
                    <Button className="w-full gap-2" asChild>
                      <Link href={area.href}>
                        Abrir módulo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <Link href="/settings?tab=plans">
                        Ver planos
                        <BriefcaseBusiness className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Perguntas rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Qual é a ordem mínima para começar bem?</AccordionTrigger>
                <AccordionContent>
                  Dashboard para visão geral, depois Clientes, Rotina, CRM e Financeiro. Essa é a mesma ordem do onboarding
                  do primeiro acesso.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Como reabrir o tutorial depois?</AccordionTrigger>
                <AccordionContent>
                  Use o botão "Reabrir tutorial" no topo desta página. O progresso salvo continua e o dashboard abre de novo
                  com o passo a passo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Onde eu ajusto conta, senha e plano?</AccordionTrigger>
                <AccordionContent>
                  Tudo fica em Configurações. Conta e segurança ficam nas abas principais; mudança de plano fica em
                  `Configurações &gt; Planos`.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Os módulos Business aparecem para todos?</AccordionTrigger>
                <AccordionContent>
                  Não. Clientes, CRM e Prospecção dependem de plano Business ativo. Se não estiver disponível, a rota correta
                  é revisar o plano em Configurações.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
