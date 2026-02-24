import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Sparkles, Mail, Phone, Building2,
  Search, TrendingUp, Target, UserPlus, DollarSign,
  Bell, Settings2, RefreshCw,
} from "lucide-react";

export default function CRM() {
  const [search, setSearch] = useState("");
  const [showNewLead, setShowNewLead] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showFollowUpSettings, setShowFollowUpSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Follow-up settings (localStorage)
  const [followUpDays, setFollowUpDays] = useState<number>(
    () => Number(localStorage.getItem("crm_followup_days") || "3")
  );
  const [followUpDaysInput, setFollowUpDaysInput] = useState(followUpDays);

  const stages = trpc.crm.getStages.useQuery();
  const allLeads = trpc.crm.listLeads.useQuery({ search: search || undefined });
  const stats = trpc.crm.stats.useQuery();
  const utils = trpc.useUtils();

  const moveLead = trpc.crm.moveLead.useMutation({
    onSuccess: () => { utils.crm.listLeads.invalidate(); utils.crm.stats.invalidate(); },
  });

  const markFollowUp = trpc.crm.markFollowUp.useMutation({
    onSuccess: (data) => {
      utils.crm.listLeads.invalidate();
      utils.crm.getStages.invalidate();
      toast.success(data.followUpCount > 1 ? `Follow Up ${data.followUpCount}x registrado!` : "Lead movido para Follow Up!");
    },
    onError: () => toast.error("Erro ao registrar follow up"),
  });

  const createLead = trpc.crm.createLead.useMutation({
    onSuccess: () => {
      utils.crm.listLeads.invalidate();
      utils.crm.stats.invalidate();
      setShowNewLead(false);
      toast.success("Lead criado com sucesso!");
    },
  });

  const generateLeads = trpc.crm.generateIdealLeads.useMutation({
    onSuccess: (data) => {
      utils.crm.listLeads.invalidate();
      utils.crm.stats.invalidate();
      setShowAIGenerate(false);
      toast.success(`${data.count} leads gerados com IA!`);
    },
    onError: () => toast.error("Erro ao gerar leads com IA"),
  });

  // Form states
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", position: "", source: "manual", notes: "" });
  const [aiParams, setAiParams] = useState({ industry: "", targetAudience: "", location: "Brasil", count: 10 });

  // Calculate which leads need follow-up (in "Contactado" stage with lastContactAt > followUpDays ago)
  const leadsNeedingFollowUp = useMemo(() => {
    if (!allLeads.data) return new Set<number>();
    const cutoff = Date.now() - followUpDays * 24 * 60 * 60 * 1000;
    return new Set(
      allLeads.data
        .filter(l => l.stage === "Contactado" && l.lastContactAt && new Date(l.lastContactAt).getTime() < cutoff)
        .map(l => l.id)
    );
  }, [allLeads.data, followUpDays]);

  const getLeadsByStage = (stageName: string) =>
    (allLeads.data || []).filter(l => l.stage === stageName);

  const daysAgo = (date: Date | null | string | undefined) => {
    if (!date) return null;
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d;
  };

  const saveFollowUpDays = () => {
    localStorage.setItem("crm_followup_days", String(followUpDaysInput));
    setFollowUpDays(followUpDaysInput);
    setShowFollowUpSettings(false);
    toast.success(`Follow-up automático configurado para ${followUpDaysInput} dias`);
  };

  return (
    <AppLayout>
    <div className="page-content space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <p className="page-kicker">Vendas</p>
          <h1 className="page-title">CRM - Gestão de Leads</h1>
          <p className="page-subtitle">Gerencie seu funil de vendas e leads</p>
        </div>
        <div className="page-actions">
          {/* Follow-up settings */}
          <Dialog open={showFollowUpSettings} onOpenChange={setShowFollowUpSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                Follow Up: {followUpDays}d
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Configurar Follow Up Automático
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Leads em "Contactado" sem resposta após X dias são sinalizados para follow-up.
                </p>
                <div>
                  <Label>Dias sem resposta para sinalizar follow-up</Label>
                  <Input
                    type="number" min={1} max={90}
                    value={followUpDaysInput}
                    onChange={e => setFollowUpDaysInput(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <Button className="w-full" onClick={saveFollowUpDays}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAIGenerate} onOpenChange={setShowAIGenerate}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Gerar com IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Gerar Leads Ideais com IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Indústria / Nicho</Label>
                  <Input placeholder="Ex: E-commerce de moda feminina" value={aiParams.industry}
                    onChange={e => setAiParams(p => ({ ...p, industry: e.target.value }))} />
                </div>
                <div>
                  <Label>Público-alvo</Label>
                  <Textarea placeholder="Descreva o perfil ideal do lead..." value={aiParams.targetAudience}
                    onChange={e => setAiParams(p => ({ ...p, targetAudience: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Localização</Label>
                    <Input value={aiParams.location}
                      onChange={e => setAiParams(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input type="number" min={1} max={20} value={aiParams.count}
                      onChange={e => setAiParams(p => ({ ...p, count: parseInt(e.target.value) || 10 }))} />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => generateLeads.mutate(aiParams)}
                  disabled={generateLeads.isPending || !aiParams.industry || !aiParams.targetAudience}>
                  {generateLeads.isPending ? "Gerando..." : <><Sparkles className="h-4 w-4" /> Gerar Leads</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Nome *</Label><Input value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Email</Label><Input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Telefone</Label><Input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>Empresa</Label><Input value={newLead.company} onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Cargo</Label><Input value={newLead.position} onChange={e => setNewLead(p => ({ ...p, position: e.target.value }))} /></div>
                  <div>
                    <Label>Fonte</Label>
                    <Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social_media">Redes Sociais</SelectItem>
                        <SelectItem value="referral">Indicação</SelectItem>
                        <SelectItem value="ads">Anúncios</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Notas</Label><Textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => createLead.mutate(newLead)} disabled={!newLead.name || createLead.isPending}>
                  {createLead.isPending ? "Criando..." : "Criar Lead"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Follow-up Alert Banner */}
      {leadsNeedingFollowUp.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/12 p-3">
          <Bell className="h-4 w-4 text-orange-700 dark:text-orange-300 flex-shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <span className="font-semibold">{leadsNeedingFollowUp.size} lead(s)</span> em "Contactado" há mais de {followUpDays} dias sem resposta — precisam de follow-up.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-1 text-sky-600 dark:text-sky-300" />
          <p className="text-2xl font-bold">{stats.data?.total || 0}</p>
          <p className="text-xs text-muted-foreground">Total de Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserPlus className="h-6 w-6 mx-auto mb-1 text-emerald-600 dark:text-emerald-300" />
          <p className="text-2xl font-bold">{stats.data?.new || 0}</p>
          <p className="text-xs text-muted-foreground">Novos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="h-6 w-6 mx-auto mb-1 text-indigo-600 dark:text-indigo-300" />
          <p className="text-2xl font-bold">{stats.data?.qualified || 0}</p>
          <p className="text-xs text-muted-foreground">Qualificados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold">{stats.data?.closed || 0}</p>
          <p className="text-xs text-muted-foreground">Fechados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto mb-1 text-amber-600 dark:text-amber-300" />
          <p className="text-2xl font-bold">R$ {((stats.data?.totalValue || 0) / 100).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Valor Total</p>
        </CardContent></Card>
      </div>

      {/* Search & View Toggle */}
      <div className="surface-card p-2.5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/80 bg-muted/45 p-1">
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("kanban")}>Kanban</Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>Lista</Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(stages.data || []).map(stage => {
            const stageLeads = getLeadsByStage(stage.name);
            const isFollowUpStage = stage.name === "Follow Up";
            return (
              <div key={stage.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || "#6366f1" }} />
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const leadId = parseInt(e.dataTransfer.getData("leadId"));
                    if (leadId) moveLead.mutate({ id: leadId, stage: stage.name });
                  }}>
                  {stageLeads.map(lead => {
                    const needsFollowUp = leadsNeedingFollowUp.has(lead.id);
                    const days = daysAgo(lead.lastContactAt);
                    const followCount = lead.followUpCount ?? 0;
                    return (
                      <Card key={lead.id}
                        className={`cursor-grab active:cursor-grabbing transition-all ${needsFollowUp ? "border-orange-500/50 shadow-orange-500/10 shadow-md" : ""} ${isFollowUpStage ? "border-orange-400/30" : ""}`}
                        draggable onDragStart={e => e.dataTransfer.setData("leadId", String(lead.id))}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{lead.name}</p>
                              {lead.company && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3 flex-shrink-0" />{lead.company}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {lead.aiGenerated && <Badge variant="outline" className="text-[10px] px-1"><Sparkles className="h-3 w-3 mr-0.5" />IA</Badge>}
                              {followCount > 1 && (
                                <Badge className="text-[10px] px-1.5 bg-orange-500/16 text-orange-700 dark:text-orange-300 border-orange-500/30">
                                  {followCount}x
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lead.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 flex-shrink-0" />{lead.email.split("@")[0]}...</span>}
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /></span>}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {lead.score !== null && lead.score !== undefined && (
                                <Badge variant={lead.score >= 70 ? "default" : lead.score >= 40 ? "secondary" : "outline"} className="text-[10px]">
                                  Score: {lead.score}
                                </Badge>
                              )}
                            </div>
                            {lead.value ? <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">R$ {(lead.value / 100).toFixed(0)}</span> : null}
                          </div>

                          {/* Last contact info */}
                          {days !== null && (
                            <p className={`text-[10px] ${needsFollowUp ? "font-medium text-orange-700 dark:text-orange-300" : "text-muted-foreground"}`}>
                              {needsFollowUp && "⚠️ "}Último contato: {days === 0 ? "hoje" : `${days}d atrás`}
                            </p>
                          )}

                          {/* Follow-up alert & button */}
                          {(needsFollowUp || isFollowUpStage) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 text-xs gap-1 border-orange-500/40 text-orange-700 dark:text-orange-300 hover:bg-orange-500/10"
                              onClick={(e) => { e.stopPropagation(); markFollowUp.mutate({ id: lead.id }); }}
                              disabled={markFollowUp.isPending}
                            >
                              <RefreshCw className="h-3 w-3" />
                              {isFollowUpStage && followCount > 0 ? `Fazer Follow Up (${followCount + 1}x)` : "Fazer Follow Up"}
                            </Button>
                          )}

                          {lead.tags && (lead.tags as string[]).filter(t => !t.startsWith("follow-up-")).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(lead.tags as string[]).filter(t => !t.startsWith("follow-up-")).slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] px-1">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Estágio</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Follow Up</th>
                  <th className="p-3">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {(allLeads.data || []).map(lead => {
                  const needsFollowUp = leadsNeedingFollowUp.has(lead.id);
                  const followCount = lead.followUpCount ?? 0;
                  return (
                    <tr key={lead.id} className={`border-b hover:bg-muted/50 ${needsFollowUp ? "bg-orange-500/5" : ""}`}>
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {needsFollowUp && <Bell className="h-3 w-3 text-orange-700 dark:text-orange-300" />}
                          {lead.name}
                          {lead.aiGenerated && <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-300" />}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{lead.company || "-"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{lead.email || "-"}</td>
                      <td className="p-3"><Badge variant="outline">{lead.stage}</Badge></td>
                      <td className="p-3"><Badge variant={lead.score && lead.score >= 70 ? "default" : "secondary"}>{lead.score || 0}</Badge></td>
                      <td className="p-3 text-sm">{lead.value ? `R$ ${(lead.value / 100).toFixed(0)}` : "-"}</td>
                      <td className="p-3">
                        {followCount > 0
                          ? <Badge className="text-[10px] bg-orange-500/16 text-orange-700 dark:text-orange-300 border-orange-500/30">{followCount}x</Badge>
                          : needsFollowUp
                            ? <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-orange-500/40 text-orange-700 dark:text-orange-300"
                                onClick={() => markFollowUp.mutate({ id: lead.id })}>
                                <RefreshCw className="h-3 w-3" />Follow Up
                              </Button>
                            : <span className="text-xs text-muted-foreground">-</span>
                        }
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{lead.source || "-"}</td>
                    </tr>
                  );
                })}
                {(!allLeads.data || allLeads.data.length === 0) && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum lead encontrado. Crie manualmente ou gere com IA.
                  </td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
    </AppLayout>
  );
}
