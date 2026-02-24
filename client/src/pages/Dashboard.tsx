import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import Onboarding from "@/components/Onboarding";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  Users, Megaphone, CheckCircle, TrendingUp, Plus, ArrowRight, Zap, Clock,
  BarChart3, Target, Timer, ListTodo, Contact, Wallet, Settings2,
  Eye, EyeOff, CheckCircle2, Circle, AlertTriangle, UserPlus,
} from "lucide-react";

// ─── Widget Registry ─────────────────────────────────────────────────────────
const WIDGETS_KEY = "adflow_dashboard_widgets";

const ALL_WIDGETS = [
  { id: "stats", label: "Resumo Campanhas", icon: BarChart3, section: "Principal" },
  { id: "recent_campaigns", label: "Campanhas Recentes", icon: Megaphone, section: "Principal" },
  { id: "quick_actions", label: "Ações Rápidas", icon: Zap, section: "Principal" },
  { id: "tasks_today", label: "Tarefas de Hoje", icon: ListTodo, section: "Produtividade" },
  { id: "habits_today", label: "Hábitos de Hoje", icon: Target, section: "Produtividade" },
  { id: "pomodoro_stats", label: "Pomodoro Stats", icon: Timer, section: "Produtividade" },
  { id: "crm_stats", label: "Resumo CRM", icon: Contact, section: "CRM & Vendas" },
  { id: "prospecting", label: "Prospecção do Dia", icon: TrendingUp, section: "CRM & Vendas" },
  { id: "financeiro_summary", label: "Resumo Financeiro", icon: Wallet, section: "Análise & IA" },
] as const;

type WidgetId = typeof ALL_WIDGETS[number]["id"];

function loadHiddenWidgets(): Set<WidgetId> {
  try { return new Set(JSON.parse(localStorage.getItem(WIDGETS_KEY) ?? "[]") as WidgetId[]); }
  catch { return new Set(); }
}

const statusColors: Record<string, string> = {
  pending: "status-pending", generating: "status-generating", review: "status-review",
  approved: "status-approved", published: "status-published", failed: "status-failed", scheduled: "status-scheduled",
};
const statusLabels: Record<string, string> = {
  pending: "Pendente", generating: "Gerando IA", review: "Em Revisão",
  approved: "Aprovada", published: "Publicada", failed: "Falhou", scheduled: "Agendada",
};
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "border-red-500/30 bg-red-500/14 text-red-700 dark:text-red-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/14 text-amber-700 dark:text-amber-300",
  LOW: "border-emerald-500/30 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
};

function toIsoDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

// ─── Individual Widgets ───────────────────────────────────────────────────────
function StatsWidget() {
  const { data: stats } = trpc.campaigns.stats.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const items = [
    { label: "Clientes", value: clients?.length ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/15" },
    { label: "Campanhas", value: stats?.total ?? 0, icon: Megaphone, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-500/14" },
    { label: "Publicadas", value: stats?.published ?? 0, icon: CheckCircle, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-500/14" },
    { label: "Em Revisão", value: stats?.inReview ?? 0, icon: Clock, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-500/14" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentCampaignsWidget() {
  const { data: campaigns } = trpc.campaigns.list.useQuery();
  const recent = (campaigns ?? []).slice(0, 5);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Megaphone className="w-4 h-4" />Campanhas Recentes
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/campaigns">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma campanha criada</p>
            <Button size="sm" className="mt-3" asChild>
              <Link href="/campaigns/new"><Plus className="w-3 h-3 mr-1" />Criar campanha</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge className={`text-xs ${statusColors[c.status] ?? ""}`}>{statusLabels[c.status] ?? c.status}</Badge>
                <Button variant="ghost" size="icon" className="w-7 h-7" asChild>
                  <Link href={`/campaigns/${c.id}`}><ArrowRight className="w-3.5 h-3.5" /></Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function QuickActionsWidget() {
  const actions = [
    { label: "Nova Campanha com IA", href: "/campaigns/new", icon: Zap, color: "text-primary" },
    { label: "Adicionar Cliente", href: "/clients", icon: Users, color: "text-indigo-700 dark:text-indigo-300" },
    { label: "Ver Agenda", href: "/agenda", icon: Clock, color: "text-sky-700 dark:text-sky-300" },
    { label: "CRM / Leads", href: "/crm", icon: Contact, color: "text-emerald-700 dark:text-emerald-300" },
  ];
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {actions.map(({ label, href, icon: Icon, color }) => (
          <Button key={href} variant="ghost" className="w-full justify-start h-9 hover:bg-muted/50" asChild>
            <Link href={href}>
              <Icon className={`w-4 h-4 mr-3 ${color}`} />
              <span className="text-sm">{label}</span>
              <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function TasksTodayWidget() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = trpc.productivity.listTasks.useQuery({ date: today });
  const updateMut = trpc.productivity.updateTask.useMutation();
  const utils = trpc.useUtils();

  const pending = (tasks ?? []).filter(t => t.status === "PENDING");

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <ListTodo className="w-4 h-4" />Tarefas de Hoje
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/routine">Ver tudo <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente para hoje 🎉</p>
        ) : (
          <div className="space-y-1.5">
            {pending.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30">
                <button onClick={() => updateMut.mutate({ id: task.id, status: "DONE" }, { onSuccess: () => utils.productivity.listTasks.invalidate() })}>
                  <Circle className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-sm flex-1 truncate">{task.title}</span>
                <Badge className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
              </div>
            ))}
            {pending.length > 5 && <p className="text-xs text-muted-foreground text-center pt-1">+{pending.length - 5} mais</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HabitsTodayWidget() {
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay();

  const { data: habits } = trpc.productivity.listHabits.useQuery();
  const { data: logs } = trpc.productivity.getHabitLogs.useQuery({ startDate: today, endDate: today });
  const toggleMut = trpc.productivity.toggleHabitLog.useMutation();
  const utils = trpc.useUtils();

  const todayHabits = useMemo(() => (habits ?? []).filter(h => {
    const days = h.daysOfWeek as number[] | null;
    return !days || days.length === 0 || days.includes(dayOfWeek);
  }), [habits, dayOfWeek]);

  const isCompleted = (id: number) => (logs ?? []).some(l => l.habitId === id && l.date === today && l.completed);
  const done = todayHabits.filter(h => isCompleted(h.id)).length;
  const progress = todayHabits.length > 0 ? Math.round((done / todayHabits.length) * 100) : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />Hábitos de Hoje
          </CardTitle>
          <span className="text-xs text-muted-foreground">{done}/{todayHabits.length}</span>
        </div>
        {todayHabits.length > 0 && <Progress value={progress} className="h-1.5 mt-2" />}
      </CardHeader>
      <CardContent>
        {todayHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito para hoje</p>
        ) : (
          <div className="space-y-1.5">
            {todayHabits.slice(0, 5).map(h => {
              const done = isCompleted(h.id);
              return (
                <div key={h.id} className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 cursor-pointer ${done ? "opacity-50" : ""}`}
                  onClick={() => toggleMut.mutate({ habitId: h.id, date: today }, { onSuccess: () => utils.productivity.getHabitLogs.invalidate() })}>
                  <span className="text-base">{h.icon}</span>
                  {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  <span className={`text-sm flex-1 truncate ${done ? "line-through" : ""}`}>{h.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PomodoroStatsWidget() {
  const { data: stats } = trpc.productivity.pomodoroStats.useQuery();
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Timer className="w-4 h-4" />Pomodoro Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hoje", value: stats?.todayCount ?? 0 },
            { label: "Semana", value: stats?.weekCount ?? 0 },
            { label: "Min Hoje", value: `${stats?.todayMinutes ?? 0}m` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
          <Link href="/routine">Abrir Timer <ArrowRight className="w-3 h-3 ml-1" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function CrmStatsWidget() {
  const { data: leads } = trpc.crm.listLeads.useQuery(undefined);
  const total = leads?.length ?? 0;
  const byStage = useMemo(() => {
    const map: Record<string, number> = {};
    (leads ?? []).forEach(l => {
      const name = l.stage ?? "Sem estágio";
      map[name] = (map[name] ?? 0) + 1;
    });
    return Object.entries(map).slice(0, 4);
  }, [leads]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Contact className="w-4 h-4" />CRM / Leads
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/crm">Ver tudo <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-sm text-muted-foreground">leads no total</span>
        </div>
        {byStage.map(([stage, count]) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-24 truncate">{stage}</span>
            <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-1.5 flex-1" />
            <span className="text-xs font-medium w-4 text-right">{count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProspectingWidget() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const storageKey = `prospected_${todayStr}`;
  const addGoal = Number(localStorage.getItem("daily_lead_add_goal") || "3");
  const prospectGoal = Number(localStorage.getItem("daily_lead_prospect_goal") || "10");
  const [prospectedToday, setProspectedToday] = useState(() => Number(localStorage.getItem(storageKey) || "0"));

  const { data: leads } = trpc.crm.listLeads.useQuery(undefined);
  const leadsToday = useMemo(
    () => (leads ?? []).filter(l => toIsoDate(l.createdAt) === todayStr).length,
    [leads, todayStr]
  );

  const addOne = () => {
    const next = prospectedToday + 1;
    setProspectedToday(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />Prospecção do Dia
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/prospecting">Detalhes <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" />Leads no CRM</span>
            <span className={leadsToday >= addGoal && addGoal > 0 ? "font-bold text-emerald-600 dark:text-emerald-300" : ""}>{leadsToday}/{addGoal}</span>
          </div>
          <Progress value={addGoal > 0 ? Math.min(100, (leadsToday / addGoal) * 100) : 0} className="h-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />Prospectados</span>
            <span className={prospectedToday >= prospectGoal && prospectGoal > 0 ? "font-bold text-emerald-600 dark:text-emerald-300" : ""}>{prospectedToday}/{prospectGoal}</span>
          </div>
          <Progress value={prospectGoal > 0 ? Math.min(100, (prospectedToday / prospectGoal) * 100) : 0} className="h-1.5" />
        </div>
        <Button size="sm" className="w-full gap-1.5 h-8" onClick={addOne}>
          <Plus className="w-3.5 h-3.5" />+1 Prospectado
        </Button>
      </CardContent>
    </Card>
  );
}

function FinanceiroSummaryWidget() {
  const month = new Date().toISOString().slice(0, 7);
  const { data: cpf } = trpc.financeiro.summary.useQuery({ personType: "cpf", month });
  const { data: cnpj } = trpc.financeiro.summary.useQuery({ personType: "cnpj", month });

  const summary = {
    income: (cpf?.income ?? 0) + (cnpj?.income ?? 0),
    expense: (cpf?.expense ?? 0) + (cnpj?.expense ?? 0),
    balance: (cpf?.balance ?? 0) + (cnpj?.balance ?? 0),
  };

  const formatBRL = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Wallet className="w-4 h-4" />Financeiro (mês)
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/financeiro">Ver tudo <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Receita</p>
            <p className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatBRL(summary.income)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">Despesa</p>
            <p className="mt-0.5 text-sm font-bold text-red-700 dark:text-red-300">{formatBRL(summary.expense)}</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${summary.balance >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}>
            <p className="text-xs text-muted-foreground font-medium">Saldo</p>
            <p className={`mt-0.5 text-sm font-bold ${summary.balance >= 0 ? "text-primary" : "text-red-700 dark:text-red-300"}`}>
              {formatBRL(summary.balance)}
            </p>
          </div>
        </div>
        {summary.balance < 0 && (
          <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />Saldo negativo este mês
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget Renderer ──────────────────────────────────────────────────────────
function renderWidget(id: WidgetId) {
  switch (id) {
    case "stats": return <StatsWidget />;
    case "recent_campaigns": return <RecentCampaignsWidget />;
    case "quick_actions": return <QuickActionsWidget />;
    case "tasks_today": return <TasksTodayWidget />;
    case "habits_today": return <HabitsTodayWidget />;
    case "pomodoro_stats": return <PomodoroStatsWidget />;
    case "crm_stats": return <CrmStatsWidget />;
    case "prospecting": return <ProspectingWidget />;
    case "financeiro_summary": return <FinanceiroSummaryWidget />;
    default: return null;
  }
}

// Some widgets span full width
const FULL_WIDTH_WIDGETS = new Set<WidgetId>(["stats", "recent_campaigns"]);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(() =>
    localStorage.getItem("adflow_onboarding_complete") !== "true"
  );
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<WidgetId>>(loadHiddenWidgets);
  const [showCustomize, setShowCustomize] = useState(false);

  const toggleWidget = (id: WidgetId) => {
    setHiddenWidgets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(WIDGETS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const visibleWidgets = ALL_WIDGETS.filter(w => !hiddenWidgets.has(w.id));
  const fullWidth = visibleWidgets.filter(w => FULL_WIDTH_WIDGETS.has(w.id));
  const grid = visibleWidgets.filter(w => !FULL_WIDTH_WIDGETS.has(w.id));

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Visão Executiva</p>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral personalizada da sua agência</p>
          </div>
          <div className="page-actions">
            <Button variant="outline" size="sm" onClick={() => setShowCustomize(true)} className="gap-2">
              <Settings2 className="w-4 h-4" />Personalizar
            </Button>
            <Button asChild size="sm">
              <Link href="/campaigns/new">
                <Plus className="w-4 h-4 mr-1" />Nova Campanha
              </Link>
            </Button>
          </div>
        </div>

        <div className="surface-card relative overflow-hidden p-4 sm:p-5">
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent" />
          <div className="relative flex flex-wrap items-center gap-3">
            <Badge className="status-generating border px-2.5 py-1 text-[11px]">Painel inteligente</Badge>
            <p className="text-sm text-muted-foreground">
              Widgets adaptáveis para acompanhar campanhas, rotina, CRM e financeiro em uma visão única.
            </p>
          </div>
        </div>

        {/* Customize Dialog */}
        <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />Personalizar Dashboard
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {ALL_WIDGETS.map(widget => {
                const isHidden = hiddenWidgets.has(widget.id);
                const Icon = widget.icon;
                return (
                  <button key={widget.id} onClick={() => toggleWidget(widget.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isHidden ? "text-muted-foreground/40" : "text-foreground"}`} />
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isHidden ? "text-muted-foreground/40 line-through" : ""}`}>{widget.label}</p>
                      <p className="text-[10px] text-muted-foreground">{widget.section}</p>
                    </div>
                    {isHidden
                      ? <EyeOff className="w-4 h-4 text-muted-foreground/40" />
                      : <Eye className="w-4 h-4 text-primary/70" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Clique em um widget para mostrar ou ocultar no dashboard.
            </p>
          </DialogContent>
        </Dialog>

        {/* Onboarding */}
        {showOnboarding && (
          <Onboarding
            onComplete={() => { localStorage.setItem("adflow_onboarding_complete", "true"); setShowOnboarding(false); }}
            onDismiss={() => { localStorage.setItem("adflow_onboarding_complete", "true"); setShowOnboarding(false); }}
          />
        )}

        {/* Full-width widgets */}
        {fullWidth.map(w => (
          <div key={w.id}>{renderWidget(w.id)}</div>
        ))}

        {/* Grid widgets */}
        {grid.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {grid.map(w => (
              <div key={w.id}>{renderWidget(w.id)}</div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {visibleWidgets.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum widget visível</p>
            <p className="text-sm mt-1">Clique em "Personalizar" para adicionar widgets ao dashboard</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCustomize(true)}>Personalizar Dashboard</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
