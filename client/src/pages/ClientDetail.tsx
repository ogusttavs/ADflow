import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { PlanGate } from "@/components/PlanGate";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, User, Settings,
  Image, FileText, Key, ClipboardList, Plus, Trash2,
  Eye, EyeOff, Copy, Download, ExternalLink, RefreshCw,
  Lock, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Link } from "wouter";

const CHANNELS = [
  { id: "instagram_feed", label: "Instagram Feed" },
  { id: "instagram_stories", label: "Instagram Stories" },
  { id: "instagram_reels", label: "Instagram Reels" },
  { id: "facebook_feed", label: "Facebook Feed" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "whatsapp", label: "WhatsApp" },
];

const DEFAULT_INTAKE_FIELDS = [
  { id: "company", type: "text" as const, label: "Nome da empresa", placeholder: "Ex: Minha Empresa LTDA", required: true },
  { id: "website", type: "url" as const, label: "Site / redes sociais", placeholder: "https://...", required: false },
  { id: "segment", type: "text" as const, label: "Segmento / nicho", placeholder: "Ex: Nutrição esportiva", required: true },
  { id: "target", type: "textarea" as const, label: "Público-alvo", placeholder: "Descreva quem são seus clientes...", required: true },
  { id: "differentials", type: "textarea" as const, label: "Diferenciais / proposta de valor", placeholder: "O que te diferencia da concorrência?", required: false },
  { id: "references", type: "textarea" as const, label: "Referências visuais", placeholder: "Marcas, cores, estilos que você aprecia...", required: false },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

// ─── Files Tab ────────────────────────────────────────────────────────────────
function FilesTab({ clientId, entityType, label }: { clientId: number; entityType: "client_creative" | "client_document"; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");

  const { data: files, refetch } = trpc.files.list.useQuery({ entityType, entityId: clientId });
  const uploadMut = trpc.files.upload.useMutation({
    onSuccess: () => { refetch(); toast.success(`${label} enviado!`); setDescription(""); },
    onError: (e) => toast.error(e.message || "Erro ao enviar arquivo"),
  });
  const deleteMut = trpc.files.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Removido"); },
  });
  const getFileMut = trpc.files.get.useMutation({
    onSuccess: (f) => {
      const link = document.createElement("a");
      link.href = f.base64Content;
      link.download = f.originalName;
      link.click();
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 10 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      uploadMut.mutate({
        entityType,
        entityId: clientId,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        base64Content: reader.result as string,
        description: description || undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label htmlFor="pages-clientdetail-descricao-opcional" className="text-xs">Descrição (opcional)</Label>
            <Input name="pages-clientdetail-descricao-opcional" id="pages-clientdetail-descricao-opcional" className="mt-1 h-8 text-sm" placeholder={`Ex: Logo versão dark`} value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <input id={`pages-clientdetail-${entityType}-upload`} name={`pages-clientdetail-${entityType}-upload`} ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending} className="w-full gap-2">
            <Plus className="w-4 h-4" />{uploadMut.isPending ? "Enviando..." : `Adicionar ${label}`}
          </Button>
          <p className="text-[10px] text-muted-foreground">Máx 10 MB</p>
        </CardContent>
      </Card>

      {(files ?? []).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {entityType === "client_creative" ? <Image className="w-8 h-8 mx-auto mb-2 opacity-30" /> : <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />}
          <p className="text-sm">Nenhum {label.toLowerCase()} armazenado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(files ?? []).map(f => (
            <Card key={f.id} className="group relative">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {isImage(f.mimeType)
                    ? <Image className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    : <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.originalName}</p>
                    {f.description && <p className="text-xs text-muted-foreground truncate">{f.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{formatBytes(f.size)} · {new Date(f.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 justify-end">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => getFileMut.mutate({ id: f.id })}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-60 hover:opacity-100"
                    onClick={() => deleteMut.mutate({ id: f.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Credentials Tab ──────────────────────────────────────────────────────────
function CredenciaisTab({ clientId }: { clientId: number }) {
  const [showNew, setShowNew] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ service: "", username: "", password: "", url: "", notes: "" });

  const { data: creds, refetch } = trpc.credentials.list.useQuery({ clientId });
  const createMut = trpc.credentials.create.useMutation({
    onSuccess: () => { refetch(); setShowNew(false); setForm({ service: "", username: "", password: "", url: "", notes: "" }); toast.success("Credencial salva!"); },
  });
  const deleteMut = trpc.credentials.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Removido"); },
  });

  const toggleVisible = (id: number) => {
    setVisibleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nova Credencial</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Lock className="w-4 h-4" />Nova Credencial</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="pages-clientdetail-servico-plataforma">Serviço / Plataforma</Label>
                <Input name="pages-clientdetail-servico-plataforma" id="pages-clientdetail-servico-plataforma" className="mt-1" placeholder="Ex: Facebook Ads, Google Ads, Hotmart..." value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pages-clientdetail-usuario-email">Usuário / Email</Label>
                  <Input name="pages-clientdetail-usuario-email" id="pages-clientdetail-usuario-email" className="mt-1" placeholder="email@exemplo.com" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pages-clientdetail-senha">Senha</Label>
                  <Input name="pages-clientdetail-senha" id="pages-clientdetail-senha" className="mt-1" type="password" placeholder="••••••••" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="pages-clientdetail-url">URL</Label>
                <Input name="pages-clientdetail-url" id="pages-clientdetail-url" className="mt-1" placeholder="https://..." value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pages-clientdetail-notas">Notas</Label>
                <Textarea name="pages-clientdetail-notas" id="pages-clientdetail-notas" className="mt-1 resize-none" rows={2} placeholder="Observações adicionais..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => createMut.mutate({ clientId, ...form })} disabled={!form.service || createMut.isPending}>
                Salvar Credencial
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">As credenciais são armazenadas de forma segura no seu servidor.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(creds ?? []).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma credencial cadastrada.</p>
          <p className="text-xs mt-1">Armazene logins de plataformas do cliente aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(creds ?? []).map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="font-medium text-sm">{c.service}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.url && (
                      <Button variant="ghost" size="icon" className="w-7 h-7" asChild>
                        <a href={c.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="w-7 h-7 opacity-60 hover:opacity-100"
                      onClick={() => deleteMut.mutate({ id: c.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {c.username && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14">Usuário</span>
                      <code className="text-xs bg-muted/50 px-2 py-0.5 rounded flex-1 truncate">{c.username}</code>
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyToClipboard(c.username!, "Usuário")}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {c.password && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14">Senha</span>
                      <code className="text-xs bg-muted/50 px-2 py-0.5 rounded flex-1 truncate">
                        {visibleIds.has(c.id) ? c.password : "•".repeat(Math.min(c.password.length, 12))}
                      </code>
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => toggleVisible(c.id)}>
                        {visibleIds.has(c.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyToClipboard(c.password!, "Senha")}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {c.notes && <p className="text-xs text-muted-foreground mt-1 ml-16">{c.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Intake Form Tab ──────────────────────────────────────────────────────────
function FormularioTab({ clientId }: { clientId: number }) {
  const { data: form, refetch } = trpc.intake.getForm.useQuery({ clientId });
  const [title, setTitle] = useState("Formulário de Onboarding");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState(DEFAULT_INTAKE_FIELDS);
  const [copied, setCopied] = useState(false);

  const saveFormMut = trpc.intake.saveForm.useMutation({
    onSuccess: () => { refetch(); toast.success("Formulário salvo!"); },
  });
  const generateTokenMut = trpc.intake.generateToken.useMutation({
    onSuccess: () => { refetch(); toast.success("Link gerado!"); },
  });

  const publicUrl = form?.token
    ? `${window.location.origin}/intake/${form.token}`
    : null;

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleField = (id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Link section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4" />Link Público do Formulário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {publicUrl ? (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted/50 px-3 py-2 rounded flex-1 truncate">{publicUrl}</code>
              <Button size="sm" variant="outline" onClick={copyLink} className="gap-2 flex-shrink-0">
                <Copy className="w-3.5 h-3.5" />{copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button size="sm" variant="ghost" asChild className="flex-shrink-0">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum link gerado ainda.</p>
          )}
          <Button size="sm" variant="outline" onClick={() => generateTokenMut.mutate({ clientId })} disabled={generateTokenMut.isPending} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {publicUrl ? "Regenerar Link" : "Gerar Link"}
          </Button>
          {publicUrl && <p className="text-[10px] text-muted-foreground">Compartilhe este link com o cliente para que ele preencha as informações da marca.</p>}
        </CardContent>
      </Card>

      {/* Form config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Configurar Formulário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pages-clientdetail-titulo">Título</Label>
            <Input name="pages-clientdetail-titulo" id="pages-clientdetail-titulo" className="mt-1" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pages-clientdetail-mensagem-de-instrucao">Mensagem de instrução</Label>
            <Textarea name="pages-clientdetail-mensagem-de-instrucao" id="pages-clientdetail-mensagem-de-instrucao" className="mt-1 resize-none" rows={2} value={description}
              placeholder="Ex: Olá! Preencha as informações abaixo para começarmos sua campanha."
              onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <p className="text-sm font-medium">Campos do formulário</p>
            <div className="mt-2 space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.type} · {f.placeholder}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Obrigatório</span>
                    <Switch checked={f.required} onCheckedChange={() => toggleField(f.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => saveFormMut.mutate({ clientId, title, description, fields })} disabled={saveFormMut.isPending}>
            <Save className="w-4 h-4 mr-2" />Salvar Formulário
          </Button>
        </CardContent>
      </Card>

      {/* Responses */}
      {form?.responses && form.submittedAt && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-400" />
              Respostas — {new Date(form.submittedAt).toLocaleDateString("pt-BR")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(form.responses).map(([fieldId, answer]) => {
              const field = fields.find(f => f.id === fieldId);
              return (
                <div key={fieldId}>
                  <p className="text-xs text-muted-foreground">{field?.label ?? fieldId}</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{answer || "—"}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();

  const { data: clientData, refetch } = trpc.clients.get.useQuery({ id }, { enabled: !!id });
  const saveConfig = trpc.clients.saveConfig.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); refetch(); },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  const { register, handleSubmit, control, setValue, watch } = useForm({
    values: {
      toneOfVoice: clientData?.config?.toneOfVoice ?? "professional",
      brandPersonality: clientData?.config?.brandPersonality ?? "",
      targetAudience: clientData?.config?.targetAudience ?? "",
      ageRange: clientData?.config?.ageRange ?? "",
      gender: clientData?.config?.gender ?? "all",
      location: clientData?.config?.location ?? "",
      interests: clientData?.config?.interests ?? "",
      productsServices: clientData?.config?.productsServices ?? "",
      mainValueProposition: clientData?.config?.mainValueProposition ?? "",
      competitors: clientData?.config?.competitors ?? "",
      primaryColor: clientData?.config?.primaryColor ?? "#6366f1",
      secondaryColor: clientData?.config?.secondaryColor ?? "#8b5cf6",
      visualStyle: clientData?.config?.visualStyle ?? "minimalist",
      activeChannels: (clientData?.config?.activeChannels as string[]) ?? [],
      additionalContext: clientData?.config?.additionalContext ?? "",
    },
  });

  const activeChannels = watch("activeChannels") as string[];
  const toggleChannel = (channelId: string) => {
    const current = activeChannels ?? [];
    setValue("activeChannels", current.includes(channelId) ? current.filter(c => c !== channelId) : [...current, channelId]);
  };

  const onSubmit = (data: any) => { saveConfig.mutate({ clientId: id, config: data }); };

  if (!clientData) {
    return (
      <AppLayout>
        <PlanGate feature="clients">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        </PlanGate>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PlanGate feature="clients">
      <div className="page-content space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{clientData.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold font-['Space_Grotesk']">{clientData.name}</h1>
              {clientData.company && <p className="text-sm text-muted-foreground">{clientData.company}</p>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {clientData.paymentStatus === "overdue" && (
              <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30">Pagamento Atrasado</Badge>
            )}
            <Badge className="status-approved">Ativo</Badge>
          </div>
        </div>

        <Tabs defaultValue="config">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted p-1">
            <TabsTrigger value="config" className="flex items-center gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" />Config. IA
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" />Informações
            </TabsTrigger>
            <TabsTrigger value="creatives" className="flex items-center gap-1.5 text-xs">
              <Image className="w-3.5 h-3.5" />Criativos
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />Documentos
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" />Credenciais
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-1.5 text-xs">
              <ClipboardList className="w-3.5 h-3.5" />Formulário
            </TabsTrigger>
          </TabsList>

          {/* AI Config Tab */}
          <TabsContent value="config">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Voz da Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-tone-of-voice">Tom de Voz</Label>
                      <Controller name="toneOfVoice" control={control} render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="pages-clientdetail-tone-of-voice" aria-label="Tom de voz" className="bg-input border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="humorous">Humorístico</SelectItem>
                            <SelectItem value="inspirational">Inspiracional</SelectItem>
                            <SelectItem value="educational">Educacional</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-personalidade-da-marca">Personalidade da Marca</Label>
                      <Textarea id="pages-clientdetail-personalidade-da-marca" {...register("brandPersonality")} placeholder="Ex: Inovadora, acessível, confiável..." className="bg-input border-border resize-none" rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-proposta-de-valor-principal">Proposta de Valor Principal</Label>
                      <Textarea id="pages-clientdetail-proposta-de-valor-principal" {...register("mainValueProposition")} placeholder="O que diferencia esta marca..." className="bg-input border-border resize-none" rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Público-Alvo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-descricao-do-publico">Descrição do Público</Label>
                      <Textarea id="pages-clientdetail-descricao-do-publico" {...register("targetAudience")} placeholder="Ex: Empreendedores entre 25-40 anos..." className="bg-input border-border resize-none" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="pages-clientdetail-faixa-etaria">Faixa Etária</Label>
                        <Input id="pages-clientdetail-faixa-etaria" {...register("ageRange")} placeholder="Ex: 25-45 anos" className="bg-input border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pages-clientdetail-gender">Gênero</Label>
                        <Controller name="gender" control={control} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="pages-clientdetail-gender" aria-label="Gênero" className="bg-input border-border"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="male">Masculino</SelectItem>
                              <SelectItem value="female">Feminino</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-localizacao">Localização</Label>
                      <Input id="pages-clientdetail-localizacao" {...register("location")} placeholder="Ex: São Paulo, Brasil" className="bg-input border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-interesses">Interesses</Label>
                      <Input id="pages-clientdetail-interesses" {...register("interests")} placeholder="Ex: Tecnologia, negócios, fitness..." className="bg-input border-border" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Produtos & Serviços</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-produtos-servicos-principais">Produtos/Serviços Principais</Label>
                      <Textarea id="pages-clientdetail-produtos-servicos-principais" {...register("productsServices")} placeholder="Liste os principais produtos ou serviços..." className="bg-input border-border resize-none" rows={4} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-concorrentes">Concorrentes</Label>
                      <Input id="pages-clientdetail-concorrentes" {...register("competitors")} placeholder="Ex: Empresa A, Empresa B..." className="bg-input border-border" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identidade Visual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="pages-clientdetail-cor-primaria">Cor Primária</Label>
                        <div className="flex gap-2">
                          <input id="pages-clientdetail-cor-primaria" type="color" {...register("primaryColor")} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                          <Input id="pages-clientdetail-cor-primaria-texto" {...register("primaryColor")} className="bg-input border-border" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pages-clientdetail-cor-secundaria">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <input id="pages-clientdetail-cor-secundaria" type="color" {...register("secondaryColor")} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                          <Input id="pages-clientdetail-cor-secundaria-texto" {...register("secondaryColor")} className="bg-input border-border" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pages-clientdetail-visual-style">Estilo Visual</Label>
                      <Controller name="visualStyle" control={control} render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="pages-clientdetail-visual-style" aria-label="Estilo visual" className="bg-input border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="minimalist">Minimalista</SelectItem>
                            <SelectItem value="bold">Arrojado</SelectItem>
                            <SelectItem value="elegant">Elegante</SelectItem>
                            <SelectItem value="playful">Divertido</SelectItem>
                            <SelectItem value="corporate">Corporativo</SelectItem>
                            <SelectItem value="creative">Criativo</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">Canais Ativos</legend>
                      <div className="flex flex-wrap gap-2">
                        {CHANNELS.map(ch => (
                          <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeChannels?.includes(ch.id) ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"}`}>
                            {ch.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contexto Adicional para IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea id="pages-clientdetail-additional-context" {...register("additionalContext")}
                      placeholder="Informações extras que a IA deve considerar ao criar campanhas..."
                      className="bg-input border-border resize-none" rows={4} />
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={saveConfig.isPending} size="lg">
                  <Save className="w-4 h-4 mr-2" />{saveConfig.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Nome", value: clientData.name },
                    { label: "Empresa", value: clientData.company },
                    { label: "E-mail", value: clientData.email },
                    { label: "Telefone", value: clientData.phone },
                    { label: "WhatsApp", value: clientData.whatsappNumber },
                    { label: "Setor", value: clientData.industry },
                    { label: "Website", value: clientData.website },
                    { label: "Cadastrado em", value: new Date(clientData.createdAt).toLocaleDateString("pt-BR") },
                  ].map(({ label, value }) => value ? (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creatives Tab */}
          <TabsContent value="creatives">
            <FilesTab clientId={id} entityType="client_creative" label="Criativo" />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <FilesTab clientId={id} entityType="client_document" label="Documento" />
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <CredenciaisTab clientId={id} />
          </TabsContent>

          {/* Intake Form Tab */}
          <TabsContent value="form">
            <FormularioTab clientId={id} />
          </TabsContent>
        </Tabs>
      </div>
      </PlanGate>
    </AppLayout>
  );
}
