import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { localDateKey } from "@/lib/date";
import { USER_SETTINGS_KEYS, getSettingBoolean } from "@/lib/user-settings";
import {
  ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Trash2,
  Calendar, ListTodo, Target, Clock, Link2, Unplug, RefreshCw, ExternalLink,
} from "lucide-react";

const WEEKDAY_HEADERS_SUNDAY_FIRST = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_HEADERS_MONDAY_FIRST = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-red-400 bg-red-500/10 border-red-500/20",
  MEDIUM: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  LOW: "text-green-400 bg-green-500/10 border-green-500/20",
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function formatGoogleEventDate(value: string | null, isAllDay: boolean) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (isAllDay) {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Agenda() {
  const today = new Date();
  const todayStr = localDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.weekStartsOnMonday, true)
  );
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newCategory, setNewCategory] = useState("WORK");

  // Data queries
  const { data: allTasks } = trpc.productivity.listTasks.useQuery({ status: "ALL" });
  const { data: habits } = trpc.productivity.listHabits.useQuery();
  const googleStatusQuery = trpc.googleCalendar.connectionStatus.useQuery();
  const googleEventsQuery = trpc.googleCalendar.listUpcomingEvents.useQuery(
    { limit: 6, days: 14 },
    { enabled: Boolean(googleStatusQuery.data?.connected) },
  );

  const startOfMonth = useMemo(() => toDateStr(viewYear, viewMonth, 1), [viewYear, viewMonth]);
  const endOfMonth = useMemo(() => {
    const last = new Date(viewYear, viewMonth + 1, 0);
    return toDateStr(viewYear, viewMonth, last.getDate());
  }, [viewYear, viewMonth]);

  const { data: habitLogs } = trpc.productivity.getHabitLogs.useQuery({ startDate: startOfMonth, endDate: endOfMonth });

  const createMut = trpc.productivity.createTask.useMutation();
  const updateMut = trpc.productivity.updateTask.useMutation();
  const deleteMut = trpc.productivity.deleteTask.useMutation();
  const utils = trpc.useUtils();

  const googleAuthMut = trpc.googleCalendar.getAuthUrl.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível iniciar conexão com Google Agenda.");
    },
  });

  const googleDisconnectMut = trpc.googleCalendar.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Google Agenda desconectado.");
      utils.googleCalendar.connectionStatus.invalidate();
      utils.googleCalendar.listUpcomingEvents.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao desconectar Google Agenda.");
    },
  });

  const googleSyncMut = trpc.googleCalendar.syncTasksForDate.useMutation({
    onSuccess: ({ created, skipped }) => {
      if (created === 0) {
        toast.info("Nenhuma tarefa elegível para sincronizar neste dia.");
      } else {
        const skippedText = skipped > 0 ? ` (${skipped} com falha)` : "";
        toast.success(`${created} tarefa(s) enviada(s) para Google Agenda${skippedText}.`);
      }
      utils.googleCalendar.listUpcomingEvents.invalidate();
      utils.googleCalendar.connectionStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao sincronizar tarefas com Google Agenda.");
    },
  });

  useEffect(() => {
    const syncWeekStart = () => {
      setWeekStartsOnMonday(getSettingBoolean(USER_SETTINGS_KEYS.weekStartsOnMonday, true));
    };
    window.addEventListener("storage", syncWeekStart);
    window.addEventListener("focus", syncWeekStart);
    return () => {
      window.removeEventListener("storage", syncWeekStart);
      window.removeEventListener("focus", syncWeekStart);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google_calendar");
    if (!status) return;

    if (status === "connected") {
      toast.success("Google Agenda conectado com sucesso.");
    } else if (status === "state_error") {
      toast.error("Falha de segurança no OAuth. Tente conectar novamente.");
    } else if (status === "missing_code") {
      toast.error("Google não retornou código de autorização.");
    } else {
      toast.error("Não foi possível concluir conexão com Google Agenda.");
    }

    params.delete("google_calendar");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);

    utils.googleCalendar.connectionStatus.invalidate();
    utils.googleCalendar.listUpcomingEvents.invalidate();
  }, [utils.googleCalendar.connectionStatus, utils.googleCalendar.listUpcomingEvents]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const firstDay = weekStartsOnMonday ? (firstWeekday + 6) % 7 : firstWeekday;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ dateStr: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ dateStr: toDateStr(viewYear, viewMonth, d), day: d });
    // Pad to full 6-week grid
    while (cells.length % 7 !== 0) cells.push({ dateStr: null, day: null });
    return cells;
  }, [viewYear, viewMonth, weekStartsOnMonday]);

  // Task count per day (for calendar dots)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of allTasks ?? []) {
      if (!t.dueDate) continue;
      const cur = map.get(t.dueDate) ?? { total: 0, done: 0 };
      cur.total++;
      if (t.status === "DONE") cur.done++;
      map.set(t.dueDate, cur);
    }
    return map;
  }, [allTasks]);

  // Habit completion per day
  const habitDoneByDate = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const log of habitLogs ?? []) {
      const cur = map.get(log.date) ?? { done: 0, total: 0 };
      if (log.completed) cur.done++;
      cur.total++;
      map.set(log.date, cur);
    }
    return map;
  }, [habitLogs]);

  // Selected day data
  const selectedDayOfWeek = useMemo(() => new Date(selectedDate + "T12:00:00").getDay(), [selectedDate]);

  const selectedTasks = useMemo(
    () => (allTasks ?? []).filter(t => t.dueDate === selectedDate).sort((a, b) => (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99")),
    [allTasks, selectedDate]
  );

  const selectedHabits = useMemo(
    () => (habits ?? []).filter(h => {
      const days = h.daysOfWeek as number[] | null;
      return !days || days.length === 0 || days.includes(selectedDayOfWeek);
    }),
    [habits, selectedDayOfWeek]
  );

  const selectedHabitLogs = useMemo(
    () => (habitLogs ?? []).filter(l => l.date === selectedDate),
    [habitLogs, selectedDate]
  );

  const isHabitDone = (habitId: number) => selectedHabitLogs.some(l => l.habitId === habitId && l.completed);

  const doneTasks = selectedTasks.filter(t => t.status === "DONE").length;
  const doneHabits = selectedHabits.filter(h => isHabitDone(h.id)).length;
  const totalItems = selectedTasks.length + selectedHabits.length;
  const doneItems = doneTasks + doneHabits;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;
    createMut.mutate({
      title: newTitle,
      dueDate: selectedDate,
      dueTime: newTime || undefined,
      priority: newPriority as "HIGH" | "MEDIUM" | "LOW",
      category: newCategory as "WORK" | "PERSONAL" | "OTHER",
    }, {
      onSuccess: () => {
        utils.productivity.listTasks.invalidate();
        setShowNewTask(false);
        setNewTitle("");
        setNewTime("");
        toast.success("Tarefa criada!");
      },
    });
  };

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
  }, [selectedDate]);

  const isToday = (dateStr: string) => dateStr === todayStr;
  const isSelected = (dateStr: string) => dateStr === selectedDate;
  const googleConfigured = Boolean(googleStatusQuery.data?.configured);
  const googleConnected = Boolean(googleStatusQuery.data?.connected);
  const weekdayHeaders = weekStartsOnMonday ? WEEKDAY_HEADERS_MONDAY_FIRST : WEEKDAY_HEADERS_SUNDAY_FIRST;

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Calendário de tarefas, hábitos e compromissos</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  Google Agenda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conecte sua conta para sincronizar tarefas da Agenda com eventos do Google Calendar.
                </p>
                {googleConnected && googleStatusQuery.data?.email && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Conectado como <span className="font-medium">{googleStatusQuery.data.email}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!googleConfigured ? (
                  <Badge variant="outline" className="text-xs">OAuth não configurado</Badge>
                ) : googleConnected ? (
                  <Badge className="text-xs">Conectado</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Desconectado</Badge>
                )}

                {googleConnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => googleSyncMut.mutate({ date: selectedDate })}
                      disabled={googleSyncMut.isPending}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      {googleSyncMut.isPending ? "Sincronizando..." : "Sincronizar dia"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => googleDisconnectMut.mutate()}
                      disabled={googleDisconnectMut.isPending}
                    >
                      <Unplug className="w-3.5 h-3.5 mr-1" />
                      {googleDisconnectMut.isPending ? "Desconectando..." : "Desconectar"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => googleAuthMut.mutate()}
                    disabled={!googleConfigured || googleAuthMut.isPending}
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1" />
                    {googleAuthMut.isPending ? "Conectando..." : "Conectar Google"}
                  </Button>
                )}
              </div>
            </div>

            {googleConnected && (
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Próximos eventos no Google
                </p>
                {(googleEventsQuery.data ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem eventos próximos no período selecionado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(googleEventsQuery.data ?? []).map(event => (
                      <div key={event.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatGoogleEventDate(event.start, event.isAllDay)}
                          </p>
                        </div>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Abrir
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Calendar ─── */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={() => {
                      setViewYear(today.getFullYear());
                      setViewMonth(today.getMonth());
                      setSelectedDate(todayStr);
                    }}>Hoje</Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekdayHeaders.map(h => (
                    <div key={h} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{h}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((cell, i) => {
                    if (!cell.dateStr) {
                      return <div key={`empty-${i}`} className="aspect-square" />;
                    }
                    const taskInfo = tasksByDate.get(cell.dateStr);
                    const habitInfo = habitDoneByDate.get(cell.dateStr);
                    const hasTasks = (taskInfo?.total ?? 0) > 0;
                    const allTasksDone = hasTasks && taskInfo!.done === taskInfo!.total;

                    return (
                      <button
                        key={cell.dateStr}
                        onClick={() => setSelectedDate(cell.dateStr!)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative group
                          ${isSelected(cell.dateStr) ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted/50"}
                          ${isToday(cell.dateStr) && !isSelected(cell.dateStr) ? "ring-1 ring-primary/50 font-semibold" : ""}
                        `}
                      >
                        <span className="text-xs leading-none">{cell.day}</span>
                        {/* Indicators */}
                        <div className="flex gap-0.5 mt-0.5 h-1">
                          {hasTasks && (
                            <span className={`w-1 h-1 rounded-full ${allTasksDone ? "bg-green-400" : isSelected(cell.dateStr) ? "bg-primary-foreground/60" : "bg-primary"}`} />
                          )}
                          {(habitInfo?.done ?? 0) > 0 && (
                            <span className={`w-1 h-1 rounded-full ${isSelected(cell.dateStr) ? "bg-primary-foreground/60" : "bg-violet-400"}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />Tarefas pendentes
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Tarefas concluídas
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Hábitos
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Day Panel ─── */}
          <div className="space-y-4">
            {/* Day summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{selectedDateLabel}</p>
                    {isToday(selectedDate) && <Badge className="text-[10px] mt-0.5">Hoje</Badge>}
                  </div>
                  <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1 h-7 text-xs">
                        <Plus className="w-3 h-3" />Tarefa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Tarefa — {selectedDateLabel}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label htmlFor="pages-agenda-titulo">Título</Label>
                          <Input name="pages-agenda-titulo" id="pages-agenda-titulo" className="mt-1" placeholder="Ex: Reunião com cliente" value={newTitle}
                            onChange={e => setNewTitle(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="pages-agenda-hora">Hora</Label>
                            <Input name="pages-agenda-hora" id="pages-agenda-hora" className="mt-1" type="time" value={newTime}
                              onChange={e => setNewTime(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="pages-agenda-prioridade">Prioridade</Label>
                            <Select value={newPriority} onValueChange={setNewPriority}>
                              <SelectTrigger id="pages-agenda-prioridade" aria-label="Prioridade da tarefa" className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="LOW">Baixa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pages-agenda-categoria">Categoria</Label>
                          <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger id="pages-agenda-categoria" aria-label="Categoria da tarefa" className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WORK">Trabalho</SelectItem>
                              <SelectItem value="PERSONAL">Pessoal</SelectItem>
                              <SelectItem value="OTHER">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full" onClick={handleCreateTask} disabled={!newTitle.trim() || createMut.isPending}>
                          Criar Tarefa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {totalItems > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doneItems}/{totalItems} itens</span>
                      <span className={`font-bold ${progress === 100 ? "text-green-400" : "text-foreground"}`}>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhuma tarefa ou hábito neste dia.</p>
                )}
              </CardContent>
            </Card>

            {/* Tasks for selected day */}
            {selectedTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" />Tarefas ({selectedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {selectedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <button onClick={() => updateMut.mutate({ id: task.id, status: task.status === "DONE" ? "PENDING" : "DONE" }, { onSuccess: () => utils.productivity.listTasks.invalidate() })}>
                        {task.status === "DONE"
                          ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                        {task.dueTime && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{task.dueTime}
                          </p>
                        )}
                      </div>
                      <Badge className={`text-[9px] px-1 border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                      <Button variant="ghost" size="icon" className="w-5 h-5 opacity-40 hover:opacity-100"
                        onClick={() => deleteMut.mutate({ id: task.id }, { onSuccess: () => utils.productivity.listTasks.invalidate() })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Habits for selected day */}
            {selectedHabits.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />Hábitos ({doneHabits}/{selectedHabits.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {selectedHabits.map(habit => {
                    const done = isHabitDone(habit.id);
                    return (
                      <div key={habit.id} className={`flex items-center gap-2 p-2 rounded-lg ${done ? "opacity-60" : ""}`}>
                        <span className="text-base">{habit.icon}</span>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>{habit.name}</span>
                      </div>
                    );
                  })}
                  {isToday(selectedDate) && (
                    <p className="text-[10px] text-muted-foreground mt-2">Marque os hábitos na aba Rotina.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {selectedTasks.length === 0 && selectedHabits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Dia livre</p>
                <p className="text-xs mt-1">Clique em "+ Tarefa" para adicionar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
