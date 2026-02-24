import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TrendingUp, UserPlus, Users, Pencil, Save, Plus, Target } from "lucide-react";

function toIsoDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function ProspectingGoals() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const storageKey = `prospected_${todayStr}`;

  const [editingGoals, setEditingGoals] = useState(false);
  const [addGoal, setAddGoal] = useState(() => Number(localStorage.getItem("daily_lead_add_goal") || "3"));
  const [prospectGoal, setProspectGoal] = useState(() => Number(localStorage.getItem("daily_lead_prospect_goal") || "10"));
  const [prospectedToday, setProspectedToday] = useState(() => Number(localStorage.getItem(storageKey) || "0"));

  const { data: leads } = trpc.crm.listLeads.useQuery(undefined);
  const leadsAddedToday = useMemo(
    () => (leads ?? []).filter(l => toIsoDate(l.createdAt) === todayStr).length,
    [leads, todayStr]
  );

  const saveGoals = () => {
    localStorage.setItem("daily_lead_add_goal", String(addGoal));
    localStorage.setItem("daily_lead_prospect_goal", String(prospectGoal));
    setEditingGoals(false);
    toast.success("Metas salvas!");
  };

  const addProspected = () => {
    const next = prospectedToday + 1;
    setProspectedToday(next);
    localStorage.setItem(storageKey, String(next));
  };

  const removeProspected = () => {
    const next = Math.max(0, prospectedToday - 1);
    setProspectedToday(next);
    localStorage.setItem(storageKey, String(next));
  };

  const addProgress = addGoal > 0 ? Math.min(100, Math.round((leadsAddedToday / addGoal) * 100)) : 0;
  const prospectProgress = prospectGoal > 0 ? Math.min(100, Math.round((prospectedToday / prospectGoal) * 100)) : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />Prospecção do Dia
          </CardTitle>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
            if (editingGoals) saveGoals(); else setEditingGoals(true);
          }}>
            {editingGoals ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingGoals && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground font-medium">Defina suas metas diárias</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pages-prospecting-leads-no-crm-dia" className="text-xs">Leads no CRM / dia</Label>
                <Input name="pages-prospecting-leads-no-crm-dia" id="pages-prospecting-leads-no-crm-dia" type="number" min="0" value={addGoal} onChange={e => setAddGoal(Number(e.target.value))} className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label htmlFor="pages-prospecting-leads-prospectados-dia" className="text-xs">Leads prospectados / dia</Label>
                <Input name="pages-prospecting-leads-prospectados-dia" id="pages-prospecting-leads-prospectados-dia" type="number" min="0" value={prospectGoal} onChange={e => setProspectGoal(Number(e.target.value))} className="h-8 text-sm mt-1" />
              </div>
            </div>
            <Button size="sm" className="w-full gap-2" onClick={saveGoals}>
              <Save className="w-3.5 h-3.5" />Salvar metas
            </Button>
          </div>
        )}

        {/* Leads adicionados no CRM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Leads adicionados ao CRM</span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${leadsAddedToday >= addGoal && addGoal > 0 ? "text-green-400" : "text-foreground"}`}>
              {leadsAddedToday}/{addGoal}
            </span>
          </div>
          <Progress value={addProgress} className="h-1.5" />
          {leadsAddedToday >= addGoal && addGoal > 0 && <p className="text-xs text-green-400">✓ Meta atingida!</p>}
        </div>

        {/* Leads prospectados (manual) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium">Leads prospectados</span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${prospectedToday >= prospectGoal && prospectGoal > 0 ? "text-green-400" : "text-foreground"}`}>
              {prospectedToday}/{prospectGoal}
            </span>
          </div>
          <Progress value={prospectProgress} className="h-1.5" />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={removeProspected} disabled={prospectedToday === 0}>−</Button>
            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={addProspected}>
              <Plus className="w-3 h-3" />+1 Prospectado
            </Button>
          </div>
          {prospectedToday >= prospectGoal && prospectGoal > 0 && <p className="text-xs text-green-400">✓ Meta atingida!</p>}
        </div>

        <p className="text-[10px] text-muted-foreground pt-1">
          Os leads prospectados resetam à meia-noite. Leads no CRM são contados automaticamente.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Prospecting() {
  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Prospecção</h1>
            <p className="text-muted-foreground">Acompanhe suas metas diárias de prospecção</p>
          </div>
        </div>
        <div className="max-w-lg">
          <ProspectingGoals />
        </div>
      </div>
    </AppLayout>
  );
}
