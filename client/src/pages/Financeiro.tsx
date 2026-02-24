import { useState, useMemo, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Wallet, Plus, TrendingUp, TrendingDown, DollarSign,
  Trash2, User, Building2, RefreshCw, Paperclip, Download,
  FileText, Image, Calendar, RotateCcw, Search, BarChart2, Tag, X,
} from "lucide-react";

type PersonType = "cpf" | "cnpj";

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function monthLabel(ym: string) {
  return new Date(ym + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── 3-Month Overview Sheet ───────────────────────────────────────────────────
function ThreeMonthsSheet({ personType }: { personType: PersonType }) {
  const { data: months } = trpc.financeiro.summary3months.useQuery({ personType });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <BarChart2 className="w-3.5 h-3.5" />Últimos 3 meses
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />Relatório — Últimos 3 meses
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {(months ?? []).map(m => {
            const expRatio = m.income > 0 ? Math.min(100, Math.round((m.expense / m.income) * 100)) : 0;
            return (
              <Card key={m.month}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{monthLabel(m.month)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Receitas</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(m.income)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Despesas</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatBRL(m.expense)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Saldo</p>
                      <p className={`text-sm font-bold ${m.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatBRL(m.balance)}
                      </p>
                    </div>
                  </div>
                  {m.income > 0 && (
                    <div className="space-y-1">
                      <Progress value={expRatio} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">{expRatio}% da receita em despesas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Receipts Tab ─────────────────────────────────────────────────────────────
function ComprovantesTab({ personType }: { personType: PersonType }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  const { data: files, refetch } = trpc.files.list.useQuery({
    entityType: "financeiro_receipt",
    personType,
  });
  const uploadMut = trpc.files.upload.useMutation({
    onSuccess: () => { refetch(); toast.success("Comprovante enviado!"); setDescription(""); },
    onError: (e) => toast.error(e.message || "Erro ao enviar arquivo"),
  });
  const deleteMut = trpc.files.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Comprovante removido"); },
  });
  const getFileMut = trpc.files.get.useMutation({
    onSuccess: (file) => {
      const link = document.createElement("a");
      link.href = file.base64Content;
      link.download = file.originalName;
      link.click();
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 10 MB)"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      uploadMut.mutate({
        entityType: "financeiro_receipt",
        personType,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        base64Content: reader.result as string,
        description: description || undefined,
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filteredFiles = useMemo(() => {
    const q = search.toLowerCase();
    return (files ?? []).filter(f =>
      !q || f.originalName.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q)
    );
  }, [files, search]);

  const getFileIcon = (mimeType: string) =>
    mimeType.startsWith("image/") ? <Image className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Paperclip className="w-4 h-4" />Enviar Comprovante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Descrição (opcional)</Label>
            <Input className="mt-1 h-8 text-sm" placeholder="Ex: Nota fiscal Fevereiro" value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full gap-2">
            <Plus className="w-4 h-4" />{uploading ? "Enviando..." : "Selecionar Arquivo"}
          </Button>
          <p className="text-[10px] text-muted-foreground">Máx 10 MB · PDF, imagens, planilhas, documentos</p>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Buscar comprovante..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Comprovantes Armazenados ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "Nenhum resultado encontrado." : "Nenhum comprovante enviado ainda."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredFiles.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                  {getFileIcon(f.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.originalName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.description && `${f.description} · `}
                      {formatBytes(f.size)} · {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-70 hover:opacity-100"
                    onClick={() => getFileMut.mutate({ id: f.id })}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-50 hover:opacity-100"
                    onClick={() => deleteMut.mutate({ id: f.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Recurring Tab ────────────────────────────────────────────────────────────
function RecorrenteTab({ personType }: { personType: PersonType }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    recurringDay: "1",
    endType: "indefinite" as "indefinite" | "month",
    endMonth: "",
  });

  const { data: categoriesData } = trpc.financeiro.listCategories.useQuery({ personType });
  const categories = form.type === "income"
    ? (categoriesData?.income ?? [])
    : (categoriesData?.expense ?? []);

  const { data: items, refetch } = trpc.financeiro.listRecurring.useQuery({ personType });
  const createMut = trpc.financeiro.createRecurring.useMutation({
    onSuccess: () => {
      refetch(); setShowNew(false);
      setForm({ type: "income", category: "", description: "", amount: "", recurringDay: "1", endType: "indefinite", endMonth: "" });
      toast.success("Item recorrente criado!");
    },
  });
  const updateMut = trpc.financeiro.updateRecurring.useMutation({
    onSuccess: () => { refetch(); toast.success("Atualizado!"); },
  });
  const deleteMut = trpc.financeiro.deleteRecurring.useMutation({
    onSuccess: () => { refetch(); toast.success("Removido"); },
  });

  const handleCreate = () => {
    if (!form.category || !form.description || !form.amount) return;
    const amountCents = Math.round(parseFloat(form.amount.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Valor inválido"); return; }
    if (form.endType === "month" && !form.endMonth) { toast.error("Informe o mês de encerramento"); return; }
    createMut.mutate({
      ...form,
      personType,
      amount: amountCents,
      recurringDay: Number(form.recurringDay),
      endMonth: form.endType === "month" ? form.endMonth : undefined,
    });
  };

  const total = useMemo(() => ({
    income: (items ?? []).filter(i => i.type === "income" && i.active && !i.isEnded).reduce((a, i) => a + i.amount, 0),
    expense: (items ?? []).filter(i => i.type === "expense" && i.active && !i.isEnded).reduce((a, i) => a + i.amount, 0),
  }), [items]);

  return (
    <div className="space-y-4">
      {(items ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Receitas recorrentes/mês</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{formatBRL(total.income)}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Despesas recorrentes/mês</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-0.5">{formatBRL(total.expense)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nova Recorrência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />Nova Recorrência — {personType.toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Tipo</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={form.type === "income" ? "default" : "outline"} size="sm" className="flex-1 gap-2"
                    onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))}>
                    <TrendingUp className="w-4 h-4" />Receita
                  </Button>
                  <Button variant={form.type === "expense" ? "destructive" : "outline"} size="sm" className="flex-1 gap-2"
                    onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))}>
                    <TrendingDown className="w-4 h-4" />Despesa
                  </Button>
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}{c.custom ? " ★" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input className="mt-1" placeholder="Ex: Assinatura Adobe, Aluguel..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input className="mt-1" placeholder="0,00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <Label>Dia do Mês</Label>
                  <Input className="mt-1" type="number" min="1" max="31" placeholder="1-31" value={form.recurringDay}
                    onChange={e => setForm(f => ({ ...f, recurringDay: e.target.value }))} />
                </div>
              </div>
              {/* End date */}
              <div>
                <Label>Encerramento</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={form.endType === "indefinite" ? "default" : "outline"} size="sm" className="flex-1 text-xs"
                    onClick={() => setForm(f => ({ ...f, endType: "indefinite", endMonth: "" }))}>Indefinido</Button>
                  <Button variant={form.endType === "month" ? "default" : "outline"} size="sm" className="flex-1 text-xs"
                    onClick={() => setForm(f => ({ ...f, endType: "month" }))}>Até mês</Button>
                </div>
                {form.endType === "month" && (
                  <Input className="mt-2" type="month" value={form.endMonth}
                    onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))} />
                )}
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? "Salvando..." : "Criar Recorrência"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {(items ?? []).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma recorrência cadastrada.</p>
              <p className="text-xs mt-1">Adicione receitas ou despesas que se repetem mensalmente.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(items ?? []).map(item => (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${!item.active || item.isEnded ? "opacity-50" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === "income" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                    {item.type === "income"
                      ? <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                      : <TrendingDown className="w-4 h-4 text-red-700 dark:text-red-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      {item.isEnded && <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">Encerrada</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />Dia {item.recurringDay} · {item.category}
                      {item.endType === "month" && item.endMonth && ` · até ${item.endMonth}`}
                    </p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${item.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {formatBRL(item.amount)}
                  </span>
                  {!item.isEnded && (
                    <Switch checked={item.active}
                      onCheckedChange={v => updateMut.mutate({ id: item.id, active: v })} />
                  )}
                  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-50 hover:opacity-100"
                    onClick={() => deleteMut.mutate({ id: item.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── New Category Dialog ───────────────────────────────────────────────────────
function NewCategoryDialog({ personType, type, onCreated }: { personType: PersonType; type: "income" | "expense"; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createMut = trpc.financeiro.createCategory.useMutation({
    onSuccess: () => { setOpen(false); setName(""); onCreated(); toast.success("Categoria criada!"); },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" title="Nova categoria">
          <Tag className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Nome da categoria" value={name} onChange={e => setName(e.target.value)} />
          <Button className="w-full" onClick={() => createMut.mutate({ name, type, personType })}
            disabled={!name.trim() || createMut.isPending}>
            Criar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function LancamentosTab({ personType }: { personType: PersonType }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.toISOString().slice(0, 7));
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    date: today.toISOString().slice(0, 10),
    receiptFileId: "" as string,
  });

  const { data: transactions, refetch } = trpc.financeiro.list.useQuery({ personType });
  const { data: summary } = trpc.financeiro.summary.useQuery({ personType, month: selectedMonth });
  const { data: receipts } = trpc.files.list.useQuery({ entityType: "financeiro_receipt", personType });
  const { data: categoriesData, refetch: refetchCats } = trpc.financeiro.listCategories.useQuery({ personType });

  const incomeCategories = categoriesData?.income ?? [];
  const expenseCategories = categoriesData?.expense ?? [];
  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  const createMut = trpc.financeiro.create.useMutation({
    onSuccess: () => {
      refetch(); setShowNew(false);
      setForm(f => ({ ...f, amount: "", description: "", category: "", receiptFileId: "" }));
      toast.success("Lançamento criado!");
    },
    onError: () => toast.error("Erro ao criar lançamento"),
  });
  const deleteMut = trpc.financeiro.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Lançamento removido"); },
  });

  const monthTransactions = useMemo(() => {
    const base = (transactions ?? []).filter(t => t.date.startsWith(selectedMonth));
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [transactions, selectedMonth, search]);

  const totalIncome = summary?.income ?? 0;
  const totalExpense = summary?.expense ?? 0;
  const balance = summary?.balance ?? 0;
  const expenseRatio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  }), []);

  const handleCreate = () => {
    if (!form.category || !form.description || !form.amount) return;
    const amountCents = Math.round(parseFloat(form.amount.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Valor inválido"); return; }
    createMut.mutate({
      type: form.type,
      personType,
      category: form.category,
      description: form.description,
      amount: amountCents,
      date: form.date,
      receiptFileId: form.receiptFileId ? Number(form.receiptFileId) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="surface-card flex items-center gap-3 flex-wrap p-3">
        <Label className="text-sm font-medium">Mês:</Label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ThreeMonthsSheet personType={personType} />

        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2 ml-auto w-full sm:w-auto"><Plus className="h-4 w-4" />Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento — {personType.toUpperCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Tipo</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={form.type === "income" ? "default" : "outline"} size="sm" className="flex-1 gap-2"
                    onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))}>
                    <TrendingUp className="h-4 w-4" />Receita
                  </Button>
                  <Button variant={form.type === "expense" ? "destructive" : "outline"} size="sm" className="flex-1 gap-2"
                    onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))}>
                    <TrendingDown className="h-4 w-4" />Despesa
                  </Button>
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}{c.custom ? " ★" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <NewCategoryDialog personType={personType} type={form.type} onCreated={refetchCats} />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input className="mt-1" placeholder="Ex: Pagamento cliente XYZ" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input className="mt-1" placeholder="0,00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input className="mt-1" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              {(receipts ?? []).length > 0 && (
                <div>
                  <Label>Comprovante (opcional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={form.receiptFileId}
                      onValueChange={v => setForm(f => ({ ...f, receiptFileId: v }))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Nenhum comprovante" />
                      </SelectTrigger>
                      <SelectContent>
                        {(receipts ?? []).map(r => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.originalName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.receiptFileId && (
                      <Button variant="outline" size="icon" className="h-9 w-9"
                        onClick={() => setForm(f => ({ ...f, receiptFileId: "" }))}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={handleCreate}
                disabled={createMut.isPending || !form.category || !form.description || !form.amount}>
                {createMut.isPending ? "Salvando..." : "Salvar Lançamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatBRL(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-700 dark:text-red-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatBRL(totalExpense)}</p>
              </div>
            </div>
            {totalIncome > 0 && (
              <div className="mt-3 space-y-1">
                <Progress value={expenseRatio} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground">{expenseRatio}% da receita</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className={balance >= 0 ? "border-blue-500/20" : "border-red-500/30"}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${balance >= 0 ? "bg-blue-500/15" : "bg-red-500/15"}`}>
                <DollarSign className={`h-5 w-5 ${balance >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${balance >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"}`}>{formatBRL(balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(summary?.byCategory ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(summary?.byCategory ?? []).sort((a, b) => b.total - a.total).map(c => (
                <div key={`${c.type}-${c.category}`} className="flex items-center gap-3">
                  <Badge className={`text-[10px] w-16 justify-center flex-shrink-0 ${c.type === "income" ? "bg-green-500/16 text-green-700 dark:text-green-300 border-green-500/30" : "bg-red-500/16 text-red-700 dark:text-red-300 border-red-500/30"}`}>
                    {c.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                  <span className="text-sm flex-1">{c.category}</span>
                  <span className={`text-sm font-medium tabular-nums ${c.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {formatBRL(c.total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex-1">
              Lançamentos — {monthLabel(selectedMonth)}
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-8 h-7 text-xs" placeholder="Buscar..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {monthTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "Nenhum resultado encontrado." : "Nenhum lançamento neste mês."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {monthTransactions.map(t => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "income" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                    {t.type === "income"
                      ? <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                      : <TrendingDown className="h-4 w-4 text-red-700 dark:text-red-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      {t.receiptFileId && <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" aria-label="Tem comprovante" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${t.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {t.type === "expense" ? "-" : "+"}{formatBRL(t.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => deleteMut.mutate({ id: t.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Per-person-type section ──────────────────────────────────────────────────
function FinanceiroSection({ personType }: { personType: PersonType }) {
  return (
    <Tabs defaultValue="lancamentos">
      <TabsList className="grid w-full max-w-sm grid-cols-3">
        <TabsTrigger value="lancamentos" className="gap-1.5 text-xs">
          <DollarSign className="w-3.5 h-3.5" />Lançamentos
        </TabsTrigger>
        <TabsTrigger value="recorrente" className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />Recorrente
        </TabsTrigger>
        <TabsTrigger value="comprovantes" className="gap-1.5 text-xs">
          <Paperclip className="w-3.5 h-3.5" />Comprovantes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="lancamentos" className="mt-6"><LancamentosTab personType={personType} /></TabsContent>
      <TabsContent value="recorrente" className="mt-6"><RecorrenteTab personType={personType} /></TabsContent>
      <TabsContent value="comprovantes" className="mt-6"><ComprovantesTab personType={personType} /></TabsContent>
    </Tabs>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Financeiro() {
  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Gestão Financeira</p>
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="page-title">Financeiro</h1>
            </div>
            <p className="page-subtitle">Lançamentos, recorrências e comprovantes — CPF e CNPJ</p>
          </div>
        </div>

        <Tabs defaultValue="cpf">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="cpf" className="gap-2">
              <User className="h-4 w-4" />CPF
            </TabsTrigger>
            <TabsTrigger value="cnpj" className="gap-2">
              <Building2 className="h-4 w-4" />CNPJ
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cpf" className="mt-6">
            <FinanceiroSection personType="cpf" />
          </TabsContent>
          <TabsContent value="cnpj" className="mt-6">
            <FinanceiroSection personType="cnpj" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
