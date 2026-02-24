import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";

const MOODS = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😤", label: "Frustrado" },
  { emoji: "😴", label: "Cansado" },
  { emoji: "🎉", label: "Animado" },
  { emoji: "💪", label: "Motivado" },
  { emoji: "😰", label: "Ansioso" },
];

function monthLabel(ym: string) {
  return new Date(ym + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dayLabel(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

export default function Diary() {
  const today = new Date().toISOString().slice(0, 10);
  const [currentMonth, setCurrentMonth] = useState(today.slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<{ id?: number; date: string; content: string; mood: string } | null>(null);

  const { data: entries, refetch } = trpc.diary.list.useQuery({ month: currentMonth });

  const upsertMut = trpc.diary.upsert.useMutation({
    onSuccess: () => { refetch(); setDialogOpen(false); setEditEntry(null); toast.success("Anotação salva!"); },
    onError: (e) => toast.error(e.message || "Erro ao salvar"),
  });
  const deleteMut = trpc.diary.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Entrada removida"); },
  });

  const prevMonth = () => {
    const d = new Date(currentMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(currentMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    const next = d.toISOString().slice(0, 7);
    if (next <= today.slice(0, 7)) setCurrentMonth(next);
  };
  const isCurrentMonth = currentMonth === today.slice(0, 7);

  const openNew = () => {
    setEditEntry({ date: today, content: "", mood: "" });
    setDialogOpen(true);
  };
  const openEdit = (e: { id: number; date: string; content: string; mood: string | null }) => {
    setEditEntry({ id: e.id, date: e.date, content: e.content, mood: e.mood ?? "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editEntry || !editEntry.content.trim()) return;
    upsertMut.mutate({ date: editEntry.date, content: editEntry.content, mood: editEntry.mood || undefined });
  };

  const sortedEntries = useMemo(() =>
    [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Pessoal</p>
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="page-title">Diário do Dia</h1>
            </div>
            <p className="page-subtitle">Registre seus sentimentos e o que está acontecendo</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-sm font-semibold capitalize min-w-36 text-center">{monthLabel(currentMonth)}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth} disabled={isCurrentMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button className="ml-auto gap-2" onClick={openNew}>
            <Plus className="w-4 h-4" />Hoje
          </Button>
        </div>

        {/* Entries */}
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <BookOpen className="w-12 h-12 opacity-20" />
            <p className="text-sm">Nenhuma entrada neste mês.</p>
            <p className="text-xs">Clique em "Hoje" para registrar seu dia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map(entry => (
              <Card key={entry.id} className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => openEdit(entry)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {entry.mood && (
                      <span className="text-2xl flex-shrink-0">{entry.mood}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground capitalize mb-1">{dayLabel(entry.date)}</p>
                      <p className="text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7 opacity-50 hover:opacity-100"
                        onClick={e => { e.stopPropagation(); openEdit(entry); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 opacity-50 hover:opacity-100 hover:text-red-500"
                        onClick={e => { e.stopPropagation(); deleteMut.mutate({ id: entry.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/New Dialog */}
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditEntry(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {editEntry?.date ? dayLabel(editEntry.date) : "Nova entrada"}
              </DialogTitle>
            </DialogHeader>
            {editEntry && (
              <div className="space-y-4 pt-2">
                {/* Date (if new, default today, allow change) */}
                <div>
                  <Label className="text-xs">Data</Label>
                  <input type="date" className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    max={today} value={editEntry.date}
                    onChange={e => setEditEntry(v => v ? { ...v, date: e.target.value } : v)} />
                </div>

                {/* Mood */}
                <div>
                  <Label className="text-xs">Como você está?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {MOODS.map(m => (
                      <button key={m.emoji}
                        className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${editEntry.mood === m.emoji ? "border-primary bg-primary/10" : "border-transparent hover:border-muted"}`}
                        title={m.label}
                        onClick={() => setEditEntry(v => v ? { ...v, mood: v.mood === m.emoji ? "" : m.emoji } : v)}>
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <Label className="text-xs">Anotações</Label>
                  <Textarea className="mt-1 min-h-36 resize-none" placeholder="Como foi o seu dia? O que você está sentindo?"
                    value={editEntry.content}
                    onChange={e => setEditEntry(v => v ? { ...v, content: e.target.value } : v)} />
                </div>

                <Button className="w-full" onClick={handleSave}
                  disabled={upsertMut.isPending || !editEntry.content.trim()}>
                  {upsertMut.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
