import { useState, useEffect, useRef, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Timer, Plus, CheckCircle2, Circle, Trash2, Play, Pause, RotateCcw,
  Target, Flame, AlertTriangle, Megaphone, Bell,
  Sun, Coffee, Brain, Zap, ListTodo,
} from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PRIORITY_COLORS: Record<string, string> = { HIGH: "text-red-400 bg-red-500/10", MEDIUM: "text-yellow-400 bg-yellow-500/10", LOW: "text-green-400 bg-green-500/10" };
const CATEGORY_ICONS: Record<string, typeof ListTodo> = { WORK: Brain, PERSONAL: Coffee, OTHER: Zap };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Pomodoro Timer Component ───────────────────────────────────────────────
function PomodoroTimer() {
  const [mode, setMode] = useState<"work" | "short_break" | "long_break">("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [label, setLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durations = useMemo(() => ({ work: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 }), []);
  const { data: stats } = trpc.productivity.pomodoroStats.useQuery();
  const saveMut = trpc.productivity.savePomodoro.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === "work") {
        saveMut.mutate({ type: "work", durationMinutes: durations.work / 60, label: label || undefined }, {
          onSuccess: () => { utils.productivity.pomodoroStats.invalidate(); toast.success("Pomodoro concluído!"); }
        });
      } else {
        toast.success("Pausa concluída! Hora de focar.");
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const switchMode = (m: "work" | "short_break" | "long_break") => {
    setMode(m); setTimeLeft(durations[m]); setIsRunning(false);
  };

  const totalTime = durations[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const modeColors = { work: "text-primary", short_break: "text-green-400", long_break: "text-blue-400" };

  return (
    <div className="max-w-sm mx-auto">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Timer className="w-4 h-4" />Pomodoro Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            {(["work", "short_break", "long_break"] as const).map(m => (
              <Button key={m} variant={mode === m ? "default" : "ghost"} size="sm" className="flex-1 text-xs" onClick={() => switchMode(m)}>
                {m === "work" ? "Foco" : m === "short_break" ? "Pausa" : "Pausa Longa"}
              </Button>
            ))}
          </div>

          <div className="text-center py-4">
            <div className={`text-6xl font-mono font-bold ${modeColors[mode]} tabular-nums`}>{formatTime(timeLeft)}</div>
            <Progress value={progress} className="mt-4 h-1.5" />
          </div>

          <Input placeholder="Rótulo (ex: Criar copies para cliente)" value={label} onChange={e => setLabel(e.target.value)} className="text-sm" />

          <div className="flex gap-2 justify-center">
            <Button onClick={() => setIsRunning(!isRunning)} size="lg" className="gap-2">
              {isRunning ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Iniciar</>}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setTimeLeft(durations[mode]); setIsRunning(false); }}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{stats?.todayCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Hoje</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{stats?.weekCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Semana</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{stats?.todayMinutes ?? 0}m</p>
              <p className="text-[10px] text-muted-foreground">Min Hoje</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Habits Component ───────────────────────────────────────────────────────
function HabitsTracker() {
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dayOfWeek = new Date().getDay();

  const startOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  }, []);
  const endOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay()));
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: habits } = trpc.productivity.listHabits.useQuery();
  const { data: logs } = trpc.productivity.getHabitLogs.useQuery({ startDate: startOfWeek, endDate: endOfWeek });
  const createMut = trpc.productivity.createHabit.useMutation();
  const toggleMut = trpc.productivity.toggleHabitLog.useMutation();
  const deleteMut = trpc.productivity.deleteHabit.useMutation();
  const utils = trpc.useUtils();

  const todayHabits = (habits ?? []).filter(h => {
    const days = h.daysOfWeek as number[] | null;
    return !days || days.length === 0 || days.includes(dayOfWeek);
  });

  const isCompleted = (habitId: number) => (logs ?? []).some(l => l.habitId === habitId && l.date === today && l.completed);
  const doneCount = todayHabits.filter(h => isCompleted(h.id)).length;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />Hábitos de Hoje
          </CardTitle>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild><Button variant="ghost" size="icon" className="w-7 h-7"><Plus className="w-4 h-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Hábito</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Treino, Leitura, Meditação" /></div>
                <div><Label>Ícone</Label><Input value={icon} onChange={e => setIcon(e.target.value)} className="w-20" /></div>
                <div>
                  <Label>Dias da Semana</Label>
                  <div className="flex gap-1 mt-1">
                    {DAYS.map((d, i) => (
                      <Button key={i} variant={selectedDays.includes(i) ? "default" : "outline"} size="sm" className="w-10 h-8 text-xs p-0"
                        onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>{d}</Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  if (!name.trim()) return;
                  createMut.mutate({ name, icon, daysOfWeek: selectedDays }, {
                    onSuccess: () => { utils.productivity.listHabits.invalidate(); setNewOpen(false); setName(""); toast.success("Hábito criado!"); }
                  });
                }}>Criar Hábito</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {todayHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito para hoje. Crie um!</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Progress value={todayHabits.length > 0 ? (doneCount / todayHabits.length) * 100 : 0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{doneCount}/{todayHabits.length}</span>
            </div>
            {todayHabits.map(habit => {
              const done = isCompleted(habit.id);
              return (
                <div key={habit.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-muted/30 ${done ? "opacity-60" : ""}`}
                  onClick={() => toggleMut.mutate({ habitId: habit.id, date: today }, { onSuccess: () => { utils.productivity.getHabitLogs.invalidate(); } })}>
                  <span className="text-lg">{habit.icon}</span>
                  {done ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                  <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>{habit.name}</span>
                  <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100" onClick={e => {
                    e.stopPropagation();
                    deleteMut.mutate({ id: habit.id }, { onSuccess: () => { utils.productivity.listHabits.invalidate(); toast.success("Hábito removido"); } });
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tasks Component ────────────────────────────────────────────────────────
function TasksList() {
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("WORK");
  const [filter, setFilter] = useState("PENDING");

  const { data: tasks } = trpc.productivity.listTasks.useQuery({ status: filter });
  const createMut = trpc.productivity.createTask.useMutation();
  const updateMut = trpc.productivity.updateTask.useMutation();
  const deleteMut = trpc.productivity.deleteTask.useMutation();
  const utils = trpc.useUtils();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <ListTodo className="w-4 h-4" />Tarefas
          </CardTitle>
          <div className="flex gap-1">
            {["PENDING", "DONE", "ALL"].map(f => (
              <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" className="text-xs h-7 px-2" onClick={() => setFilter(f)}>
                {f === "PENDING" ? "Pendentes" : f === "DONE" ? "Feitas" : "Todas"}
              </Button>
            ))}
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="w-7 h-7"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Ligar pro cliente MyCreatine" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Data</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
                    <div><Label>Hora</Label><Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Prioridade</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="LOW">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WORK">Trabalho</SelectItem>
                          <SelectItem value="PERSONAL">Pessoal</SelectItem>
                          <SelectItem value="OTHER">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => {
                    if (!title.trim()) return;
                    createMut.mutate({ title, dueDate, dueTime: dueTime || undefined, priority: priority as "HIGH" | "MEDIUM" | "LOW", category: category as "WORK" | "PERSONAL" | "OTHER" }, {
                      onSuccess: () => { utils.productivity.listTasks.invalidate(); setNewOpen(false); setTitle(""); toast.success("Tarefa criada!"); }
                    });
                  }}>Criar Tarefa</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(tasks ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa {filter === "PENDING" ? "pendente" : "encontrada"}.</p>
        ) : (
          <div className="space-y-1">
            {(tasks ?? []).map(task => {
              const CatIcon = CATEGORY_ICONS[task.category] || ListTodo;
              const isOverdue = task.status === "PENDING" && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
              return (
                <div key={task.id} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors ${isOverdue ? "border border-red-500/30" : ""}`}>
                  <button onClick={() => updateMut.mutate({ id: task.id, status: task.status === "DONE" ? "PENDING" : "DONE" }, { onSuccess: () => utils.productivity.listTasks.invalidate() })}>
                    {task.status === "DONE" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <CatIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.dueDate && <span className={`text-[10px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>{task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ""}</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                  <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => deleteMut.mutate({ id: task.id }, { onSuccess: () => { utils.productivity.listTasks.invalidate(); } })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Daily Briefing Component ───────────────────────────────────────────────
function DailyBriefing() {
  const { data: briefing } = trpc.productivity.dailyBriefing.useQuery();
  if (!briefing) return null;

  const items = [
    { icon: Sun, label: "Hábitos ontem", value: `${briefing.yesterdayHabitStats.done}/${briefing.yesterdayHabitStats.total}`, color: briefing.yesterdayHabitStats.done === briefing.yesterdayHabitStats.total ? "text-green-400" : "text-yellow-400" },
    { icon: ListTodo, label: "Tarefas hoje", value: briefing.todayTasks.length, color: "text-primary" },
    { icon: AlertTriangle, label: "Atrasadas", value: briefing.overdueTasks.length, color: briefing.overdueTasks.length > 0 ? "text-red-400" : "text-green-400" },
    { icon: Timer, label: "Pomodoros hoje", value: briefing.pomodoroStats.today, color: "text-violet-400" },
    { icon: Megaphone, label: "Campanhas pendentes", value: briefing.pendingCampaigns, color: "text-blue-400" },
    { icon: Bell, label: "Notificações", value: briefing.unreadNotifications, color: briefing.unreadNotifications > 0 ? "text-yellow-400" : "text-muted-foreground" },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />Daily Briefing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {items.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-2 rounded-lg bg-background/50">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
        {briefing.overdueTasks.length > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{briefing.overdueTasks.length} tarefa(s) atrasada(s):</p>
            {briefing.overdueTasks.slice(0, 3).map(t => (
              <p key={t.id} className="text-xs text-red-300/80 ml-4 mt-0.5">• {t.title} ({t.dueDate})</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Day Header Component ────────────────────────────────────────────────────
const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function DayHeader() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();

  const { data: allTasks } = trpc.productivity.listTasks.useQuery({ status: "ALL" });
  const { data: habits } = trpc.productivity.listHabits.useQuery();
  const { data: habitLogs } = trpc.productivity.getHabitLogs.useQuery({ startDate: todayStr, endDate: todayStr });

  const todayTasks = useMemo(() => (allTasks ?? []).filter(t => t.dueDate === todayStr), [allTasks, todayStr]);
  const doneTasks = todayTasks.filter(t => t.status === "DONE").length;

  const todayHabits = useMemo(() => (habits ?? []).filter(h => {
    const days = h.daysOfWeek as number[] | null;
    return !days || days.length === 0 || days.includes(dayOfWeek);
  }), [habits, dayOfWeek]);
  const doneHabits = useMemo(
    () => todayHabits.filter(h => (habitLogs ?? []).some(l => l.habitId === h.id && l.date === todayStr && l.completed)).length,
    [todayHabits, habitLogs, todayStr]
  );

  const totalItems = todayTasks.length + todayHabits.length;
  const doneItems = doneTasks + doneHabits;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-mono font-bold text-foreground tabular-nums">{hh}:{mm}</span>
            <div>
              <p className="text-base font-semibold text-foreground">{WEEKDAYS[now.getDay()]}</p>
              <p className="text-sm text-muted-foreground">{now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}</p>
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {totalItems === 0
              ? "Nenhum item para hoje"
              : `${doneItems} de ${totalItems} itens concluídos`}
          </p>
          <div className="flex items-center gap-3 sm:justify-end text-xs text-muted-foreground">
            {todayTasks.length > 0 && <span>{doneTasks}/{todayTasks.length} tarefas</span>}
            {todayHabits.length > 0 && <span>{doneHabits}/{todayHabits.length} hábitos</span>}
          </div>
          <span className={`text-2xl font-bold ${progress === 100 ? "text-green-400" : progress >= 50 ? "text-primary" : "text-muted-foreground"}`}>
            {progress}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        {progress === 100 && totalItems > 0 && (
          <p className="text-xs text-green-400 font-medium">🎉 Dia concluído! Todas as tarefas e hábitos feitos.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Routine Page ──────────────────────────────────────────────────────
export default function Routine() {
  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <DayHeader />
        <DailyBriefing />

        <Tabs defaultValue="rotina">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="rotina" className="gap-1.5">
              <Target className="w-3.5 h-3.5" />Rotina
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="gap-1.5">
              <Timer className="w-3.5 h-3.5" />Pomodoro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rotina" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HabitsTracker />
              <TasksList />
            </div>
          </TabsContent>

          <TabsContent value="pomodoro" className="mt-6">
            <PomodoroTimer />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
