import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Target, Sun, ArrowRight, Wallet, Check, X } from "lucide-react";
import { toast } from "sonner";
import { localDateKey } from "@/lib/date";
import { USER_SETTINGS_KEYS, getSettingBoolean } from "@/lib/user-settings";

const STORAGE_KEY = "adflow_briefing_date";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function DailyBriefingPopup() {
  const today = localDateKey();
  const [open, setOpen] = useState(false);
  const [postponed, setPostponed] = useState(false);

  // Only show once per day
  useEffect(() => {
    const showOnLogin = getSettingBoolean(USER_SETTINGS_KEYS.showDailyBriefingOnLogin, true);
    if (!showOnLogin) return;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown !== today) {
      // Small delay so the page loads first
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [today]);

  const { data: briefing, isLoading } = trpc.productivity.morningBriefing.useQuery(undefined, {
    enabled: open,
  });
  const missedHabits = briefing?.missedHabits ?? [];
  const overdueTasks = briefing?.overdueTasks ?? [];
  const duePayments = briefing?.duePayments ?? [];

  const utils = trpc.useUtils();
  const postponeMut = trpc.productivity.postponeOverdueTasks.useMutation();

  // Auto-postpone overdue tasks when popup opens
  useEffect(() => {
    if (open && !postponed && overdueTasks.length > 0) {
      postponeMut.mutate(undefined, {
        onSuccess: (data) => {
          setPostponed(true);
          utils.productivity.listTasks.invalidate();
          if (data.count > 0) {
            toast.info(`${data.count} tarefa(s) atrasada(s) movida(s) para hoje automaticamente.`);
          }
        },
      });
    }
  }, [open, overdueTasks.length, postponed, postponeMut, utils.productivity.listTasks]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, today);
    setOpen(false);
  };

  const weekday = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
  const dateLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const markPaidMut = trpc.billing.markPaid.useMutation({
    onSuccess: () => { utils.productivity.morningBriefing.invalidate(); toast.success("Marcado como pago!"); },
  });
  const markOverdueMut = trpc.billing.markOverdue.useMutation({
    onSuccess: () => { utils.productivity.morningBriefing.invalidate(); toast.info("Marcado como atrasado."); },
  });

  const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const hasIssues = missedHabits.length > 0 || overdueTasks.length > 0 || duePayments.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sun className="w-5 h-5 text-yellow-400" />
            {getGreeting()}! ☀️
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium capitalize">{weekday}</p>
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !hasIssues ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="font-medium">Ontem foi perfeito!</p>
              <p className="text-sm text-muted-foreground">Todos os hábitos e tarefas foram concluídos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Resumo de ontem:</p>

              {/* Overdue tasks */}
              {overdueTasks.length > 0 && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <p className="text-sm font-medium text-orange-300">
                      {overdueTasks.length} tarefa(s) atrasada(s) → movidas para hoje
                    </p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {overdueTasks.slice(0, 4).map(t => (
                      <div key={t.id} className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-orange-400/60" />
                        <p className="text-xs text-muted-foreground truncate">{t.title}</p>
                        <Badge className={`text-[9px] ml-auto flex-shrink-0 ${t.priority === "HIGH" ? "bg-red-500/20 text-red-300" : t.priority === "LOW" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                          {t.priority}
                        </Badge>
                      </div>
                    ))}
                    {overdueTasks.length > 4 && (
                      <p className="text-xs text-muted-foreground ml-5">+{overdueTasks.length - 4} mais...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Missed habits */}
              {missedHabits.length > 0 && (
                <div className="rounded-lg border border-muted bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {missedHabits.length} hábito(s) não feito(s) ontem
                    </p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {missedHabits.map(h => (
                      <div key={h.id} className="flex items-center gap-2">
                        <span className="text-sm">{h.icon}</span>
                        <p className="text-xs text-muted-foreground">{h.name}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-6">Hábitos seguem a programação normal — sem repasse automático.</p>
                </div>
              )}

              {/* Due payments today */}
              {duePayments.length > 0 && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-medium text-blue-300">
                      {duePayments.length} pagamento(s) vencem hoje
                    </p>
                  </div>
                  <div className="space-y-2 ml-1">
                    {duePayments.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.clientName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(p.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-green-400 hover:text-green-300"
                          onClick={() => markPaidMut.mutate({ id: p.id })} disabled={markPaidMut.isPending}>
                          <Check className="w-3 h-3" />Pago
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-red-400 hover:text-red-300"
                          onClick={() => markOverdueMut.mutate({ id: p.id })} disabled={markOverdueMut.isPending}>
                          <X className="w-3 h-3" />Atrasado
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={handleDismiss}>
              Começar o dia! 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
