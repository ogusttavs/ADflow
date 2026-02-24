import AppLayout from "@/components/AppLayout";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Bell, Shield, Palette, Save, MoonStar, Sun, Users, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const THEME_OPTIONS: Array<{
  id: Theme;
  label: string;
  subtitle: string;
  shell: string;
  header: string;
  lineA: string;
  lineB: string;
}> = [
  {
    id: "light",
    label: "Claro",
    subtitle: "Neutro e clean",
    shell: "bg-slate-50 border-slate-200 text-slate-900",
    header: "bg-blue-500/85",
    lineA: "bg-slate-300",
    lineB: "bg-slate-200",
  },
  {
    id: "dark",
    label: "Escuro",
    subtitle: "Padrão dark",
    shell: "bg-slate-900 border-slate-700 text-slate-100",
    header: "bg-indigo-400/80",
    lineA: "bg-slate-700",
    lineB: "bg-slate-800",
  },
  {
    id: "dark-blue",
    label: "Dark Blue",
    subtitle: "Azul profundo",
    shell: "bg-[#0c1a3f] border-[#253e80] text-[#dbe7ff]",
    header: "bg-[#7ca2ff]",
    lineA: "bg-[#2e4f9b]",
    lineB: "bg-[#1f3672]",
  },
  {
    id: "all-black",
    label: "All Black",
    subtitle: "Contraste máximo",
    shell: "bg-black border-zinc-800 text-zinc-100",
    header: "bg-zinc-100/90",
    lineA: "bg-zinc-700",
    lineB: "bg-zinc-800",
  },
  {
    id: "iron-man",
    label: "Iron Man",
    subtitle: "Vermelho e dourado",
    shell: "bg-[#1d0d0b] border-[#74251b] text-[#ffd8a0]",
    header: "bg-[#ffbf3e]",
    lineA: "bg-[#b73726]",
    lineB: "bg-[#7a2419]",
  },
];

export default function Settings() {
  const { theme, setTheme, toggleTheme, switchable } = useTheme();
  const [notifNewCampaign, setNotifNewCampaign] = useState(true);
  const [notifPublished, setNotifPublished] = useState(true);
  const [notifFailed, setNotifFailed] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Sistema</p>
            <h1 className="page-title">Configurações</h1>
            <p className="page-subtitle">Gerencie as configurações da sua plataforma</p>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />Geral
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />Notificações
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />Automação
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />Aparência
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />Família & Equipe
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações da Agência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nome da Agência</Label>
                      <Input defaultValue="AdFlow Agency" className="bg-input border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <Input defaultValue="https://adflow.com.br" className="bg-input border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-mail de Contato</Label>
                      <Input type="email" defaultValue="contato@adflow.com.br" className="bg-input border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone / WhatsApp</Label>
                      <Input defaultValue="+55 11 99999-9999" className="bg-input border-border" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição da Agência</Label>
                    <Textarea
                      defaultValue="Agência de marketing digital especializada em automação e IA."
                      className="bg-input border-border resize-none"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Configurações de IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Idioma Padrão para Geração</Label>
                    <Input defaultValue="Português Brasileiro (pt-BR)" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instrução Global para IA</Label>
                    <Textarea
                      defaultValue="Sempre crie conteúdo em português brasileiro, com linguagem adequada ao público-alvo. Evite clichês e seja criativo."
                      className="bg-input border-border resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">Esta instrução é adicionada a todos os prompts de geração de conteúdo.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />Salvar Configurações
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notificações do Proprietário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Nova solicitação de campanha via WhatsApp", desc: "Notificar quando um cliente enviar uma solicitação", value: notifNewCampaign, onChange: setNotifNewCampaign },
                  { label: "Campanha publicada com sucesso", desc: "Notificar quando uma publicação for enviada às redes sociais", value: notifPublished, onChange: setNotifPublished },
                  { label: "Falha na publicação", desc: "Notificar quando uma publicação falhar", value: notifFailed, onChange: setNotifFailed },
                ].map(({ label, desc, value, onChange }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <Switch checked={value} onCheckedChange={onChange} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation */}
          <TabsContent value="automation">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fluxo de Automação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Aprovação Automática de Cópias</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aprovar automaticamente as cópias geradas pela IA sem revisão manual</p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
                <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Publicação Automática</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Publicar automaticamente nas redes sociais após aprovação da campanha</p>
                  </div>
                  <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
                </div>
                {(autoApprove || autoPublish) && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">⚠️ Atenção: Com automação total ativa, as campanhas serão publicadas sem revisão humana. Certifique-se de que os dados dos clientes estão corretos.</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Aparência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Tema da interface</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha entre tema claro, escuro e variações premium.
                    </p>
                  </div>
                  {switchable ? (
                    <Button variant="outline" onClick={() => toggleTheme?.()} className="shrink-0 gap-2">
                      {theme === "light" ? <MoonStar className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      {theme === "light" ? "Alternar rápido" : "Voltar ao claro"}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tema fixo</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {THEME_OPTIONS.map((option) => {
                    const isActive = theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme?.(option.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-primary ring-2 ring-primary/25 bg-primary/5"
                            : "border-border/80 bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className={`rounded-lg border p-3 ${option.shell}`}>
                          <div className={`h-2.5 w-20 rounded ${option.header}`} />
                          <div className={`mt-2 h-2 w-full rounded ${option.lineA}`} />
                          <div className={`mt-1.5 h-2 w-3/4 rounded ${option.lineB}`} />
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                          </div>
                          {isActive && <Badge className="text-[10px]">Ativo</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">
                    Dica: a prévia do tema claro agora é fixa e aparece corretamente mesmo quando você está usando um tema escuro.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Family & Team */}
          <TabsContent value="family">
            <FamilyTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ─── Family Tab ──────────────────────────────────────────────────────────────
function FamilyTab() {
  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: links } = trpc.family.listLinks.useQuery();
  const sendInviteMut = trpc.family.sendInvite.useMutation();
  const acceptMut = trpc.family.acceptInvite.useMutation();
  const rejectMut = trpc.family.rejectInvite.useMutation();
  const removeMut = trpc.family.removeLink.useMutation();
  const updateMut = trpc.family.updateLink.useMutation();

  const myIdNum = me?.id ?? null;
  const mySentLinks = (links ?? []).filter(l => l.ownerId === myIdNum);
  const myReceivedLinks = (links ?? []).filter(l => l.linkedUserId === myIdNum);

  // ── Invite dialog state ──────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState<"spouse" | "employee">("spouse");
  const [inviteShareCpf, setInviteShareCpf] = useState(true);
  const [inviteShareCnpj, setInviteShareCnpj] = useState(false);
  const [invitePermission, setInvitePermission] = useState<"view" | "edit">("view");
  const [inviteShareProductivity, setInviteShareProductivity] = useState(false);

  // ── Edit dialog state ───────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editShareCpf, setEditShareCpf] = useState(true);
  const [editShareCnpj, setEditShareCnpj] = useState(false);
  const [editPermission, setEditPermission] = useState<"view" | "edit">("view");
  const [editShareProductivity, setEditShareProductivity] = useState(false);

  const refresh = () => utils.family.listLinks.invalidate();

  function openEdit(link: typeof mySentLinks[number]) {
    const types = link.sharePersonTypes as string[];
    setEditId(link.id);
    setEditShareCpf(types.includes("cpf"));
    setEditShareCnpj(types.includes("cnpj"));
    setEditPermission(link.permission as "view" | "edit");
    setEditShareProductivity(link.shareProductivity);
    setEditOpen(true);
  }

  function handleSendInvite() {
    const sharePersonTypes: Array<"cpf" | "cnpj"> = [];
    if (inviteShareCpf) sharePersonTypes.push("cpf");
    if (inviteShareCnpj) sharePersonTypes.push("cnpj");
    if (sharePersonTypes.length === 0) { toast.error("Selecione ao menos CPF ou CNPJ"); return; }

    sendInviteMut.mutate({
      email: inviteEmail,
      type: inviteType,
      sharePersonTypes,
      permission: invitePermission,
      shareProductivity: inviteType === "spouse" ? inviteShareProductivity : false,
    }, {
      onSuccess: () => { toast.success("Convite enviado!"); setInviteOpen(false); setInviteEmail(""); refresh(); },
      onError: (e) => toast.error(e.message),
    });
  }

  function handleSaveEdit() {
    if (!editId) return;
    const sharePersonTypes: Array<"cpf" | "cnpj"> = [];
    if (editShareCpf) sharePersonTypes.push("cpf");
    if (editShareCnpj) sharePersonTypes.push("cnpj");
    if (sharePersonTypes.length === 0) { toast.error("Selecione ao menos CPF ou CNPJ"); return; }

    updateMut.mutate({
      id: editId,
      sharePersonTypes,
      permission: editPermission,
      shareProductivity: editShareProductivity,
    }, {
      onSuccess: () => { toast.success("Conexão atualizada!"); setEditOpen(false); refresh(); },
      onError: (e) => toast.error(e.message),
    });
  }

  const statusBadge = (s: string) => {
    if (s === "pending") return <Badge variant="outline" className="text-yellow-500 border-yellow-500/40 text-[10px]">Pendente</Badge>;
    if (s === "accepted") return <Badge variant="outline" className="text-green-500 border-green-500/40 text-[10px]">Aceito</Badge>;
    return <Badge variant="outline" className="text-red-400 border-red-400/40 text-[10px]">Recusado</Badge>;
  };

  const typeBadge = (t: string) => (
    <Badge variant="secondary" className="text-[10px]">{t === "spouse" ? "👫 Cônjuge" : "💼 Funcionário"}</Badge>
  );

  return (
    <div className="space-y-6">
      {/* ── Enviados ─────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Conexões Enviadas
            </CardTitle>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setInviteOpen(true)}>
              <Plus className="w-3.5 h-3.5" />Convidar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {mySentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conexão enviada ainda.</p>
          ) : (
            mySentLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{link.linked?.name || link.invitedEmail}</p>
                    {typeBadge(link.type)}
                    {statusBadge(link.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {link.linked?.email} · {link.permission === "edit" ? "Pode editar" : "Somente leitura"}
                    {(link.sharePersonTypes as string[]).includes("cpf") && " · CPF"}
                    {(link.sharePersonTypes as string[]).includes("cnpj") && " · CNPJ"}
                    {link.shareProductivity && " · Rotina"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {link.status === "accepted" && (
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(link)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => removeMut.mutate({ id: link.id }, { onSuccess: () => { toast.success("Conexão removida"); refresh(); } })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Recebidos ────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Convites Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myReceivedLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum convite recebido.</p>
          ) : (
            myReceivedLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{link.owner?.name || "Desconhecido"}</p>
                    {typeBadge(link.type)}
                    {statusBadge(link.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {link.owner?.email}
                    {(link.sharePersonTypes as string[]).includes("cpf") && " · CPF"}
                    {(link.sharePersonTypes as string[]).includes("cnpj") && " · CNPJ"}
                    {link.shareProductivity && " · Rotina"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {link.status === "pending" ? (
                    <>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-500 hover:text-green-500"
                        onClick={() => acceptMut.mutate({ id: link.id }, { onSuccess: () => { toast.success("Convite aceito!"); refresh(); } })}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                        onClick={() => rejectMut.mutate({ id: link.id }, { onSuccess: () => { toast.success("Convite recusado."); refresh(); } })}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                      onClick={() => removeMut.mutate({ id: link.id }, { onSuccess: () => { toast.success("Você saiu da conexão."); refresh(); } })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Send Invite Dialog ────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Pessoa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>E-mail do usuário</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com" />
              <p className="text-xs text-muted-foreground">A pessoa precisa já ter uma conta no sistema.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de vínculo</Label>
              <Select value={inviteType} onValueChange={v => setInviteType(v as "spouse" | "employee")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">👫 Cônjuge</SelectItem>
                  <SelectItem value="employee">💼 Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Compartilhar finanças de</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={inviteShareCpf} onCheckedChange={setInviteShareCpf} />
                  <span className="text-sm">CPF (Pessoa Física)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={inviteShareCnpj} onCheckedChange={setInviteShareCnpj} />
                  <span className="text-sm">CNPJ (Empresa)</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Permissão</Label>
              <Select value={invitePermission} onValueChange={v => setInvitePermission(v as "view" | "edit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Somente leitura</SelectItem>
                  <SelectItem value="edit">Pode editar (criar/excluir)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteType === "spouse" && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Compartilhar rotina</p>
                  <p className="text-xs text-muted-foreground">Hábitos e tarefas visíveis na tela de Rotina</p>
                </div>
                <Switch checked={inviteShareProductivity} onCheckedChange={setInviteShareProductivity} />
              </div>
            )}
            <Button className="w-full" disabled={!inviteEmail || sendInviteMut.isPending}
              onClick={handleSendInvite}>
              {sendInviteMut.isPending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Link Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Conexão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Compartilhar finanças de</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={editShareCpf} onCheckedChange={setEditShareCpf} />
                  <span className="text-sm">CPF (Pessoa Física)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={editShareCnpj} onCheckedChange={setEditShareCnpj} />
                  <span className="text-sm">CNPJ (Empresa)</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Permissão</Label>
              <Select value={editPermission} onValueChange={v => setEditPermission(v as "view" | "edit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Somente leitura</SelectItem>
                  <SelectItem value="edit">Pode editar (criar/excluir)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Compartilhar rotina</p>
                <p className="text-xs text-muted-foreground">Hábitos e tarefas visíveis na tela de Rotina</p>
              </div>
              <Switch checked={editShareProductivity} onCheckedChange={setEditShareProductivity} />
            </div>
            <Button className="w-full" disabled={updateMut.isPending} onClick={handleSaveEdit}>
              {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
