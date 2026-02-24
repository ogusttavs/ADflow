import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Wallet, Sparkles, PieChart, TrendingUp, Save } from "lucide-react";

const CHANNELS = ["instagram", "facebook", "tiktok", "linkedin", "google_ads", "youtube"];

export default function Budget() {
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [totalBudget, setTotalBudget] = useState(500000); // R$5000 in cents
  const [allocations, setAllocations] = useState<Record<string, number>>({
    instagram: 30, facebook: 25, tiktok: 15, linkedin: 10, google_ads: 15, youtube: 5,
  });
  const [objective, setObjective] = useState("Maximizar conversões");
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestedAllocations: Record<string, number>; reasoning: string; expectedImpact: string } | null>(null);

  const clients = trpc.clients.list.useQuery();
  const budgets = trpc.budget.list.useQuery({ clientId: selectedClientId }, { enabled: selectedClientId > 0 });
  const utils = trpc.useUtils();

  const saveBudget = trpc.budget.save.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
      toast.success("Orçamento salvo!");
    },
  });

  const optimize = trpc.budget.optimizeWithAI.useMutation({
    onSuccess: (data) => {
      setAiSuggestion(data);
      toast.success("Sugestão de otimização gerada pela IA!");
    },
    onError: () => toast.error("Erro ao otimizar com IA"),
  });

  const totalPercentage = useMemo(() => Object.values(allocations).reduce((s, v) => s + v, 0), [allocations]);

  const applyAISuggestion = () => {
    if (!aiSuggestion?.suggestedAllocations) return;
    setAllocations(aiSuggestion.suggestedAllocations);
    toast.success("Sugestão da IA aplicada!");
  };

  const channelLabels: Record<string, string> = {
    instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
    linkedin: "LinkedIn", google_ads: "Google Ads", youtube: "YouTube",
  };

  const channelColors: Record<string, string> = {
    instagram: "#E4405F", facebook: "#1877F2", tiktok: "#000000",
    linkedin: "#0A66C2", google_ads: "#4285F4", youtube: "#FF0000",
  };

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" /> Orçamento</h1>
          <p className="text-muted-foreground">Distribua e otimize o orçamento por canal com IA</p>
        </div>
        <Select value={String(selectedClientId)} onValueChange={v => setSelectedClientId(parseInt(v))}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Selecione um cliente</SelectItem>
            {(clients.data || []).map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClientId === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Selecione um cliente para gerenciar o orçamento</p>
        </CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Budget Allocation */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Distribuição de Orçamento</span>
                  <Badge variant={totalPercentage === 100 ? "default" : "destructive"}>{totalPercentage}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Orçamento Total Mensal (R$)</Label>
                  <Input type="number" value={totalBudget / 100} onChange={e => setTotalBudget(parseFloat(e.target.value) * 100 || 0)} />
                </div>

                {CHANNELS.map(ch => (
                  <div key={ch} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors[ch] }} />
                        {channelLabels[ch]}
                      </Label>
                      <span className="text-sm font-medium">
                        {allocations[ch] || 0}% = R$ {((totalBudget * (allocations[ch] || 0)) / 10000).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={allocations[ch] || 0} className="flex-1" />
                      <Input type="number" min={0} max={100} className="w-20" value={allocations[ch] || 0}
                        onChange={e => setAllocations(p => ({ ...p, [ch]: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 gap-2" onClick={() => saveBudget.mutate({
                    clientId: selectedClientId,
                    month: new Date().toISOString().slice(0, 7),
                    totalBudget,
                    allocations,
                  })} disabled={saveBudget.isPending || totalPercentage !== 100}>
                    <Save className="h-4 w-4" /> Salvar Orçamento
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => optimize.mutate({
                    clientId: selectedClientId,
                    totalBudget,
                    currentAllocations: allocations,
                    objective,
                  })} disabled={optimize.isPending}>
                    {optimize.isPending ? "Otimizando..." : <><Sparkles className="h-4 w-4" /> Otimizar com IA</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label>Objetivo da Otimização</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maximizar conversões">Maximizar conversões</SelectItem>
                  <SelectItem value="Maximizar alcance">Maximizar alcance</SelectItem>
                  <SelectItem value="Minimizar CPA">Minimizar CPA</SelectItem>
                  <SelectItem value="Maximizar ROAS">Maximizar ROAS</SelectItem>
                  <SelectItem value="Brand awareness">Brand awareness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="space-y-4">
            {aiSuggestion && (
              <Card className="border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-purple-500" /> Sugestão da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {Object.entries(aiSuggestion.suggestedAllocations).map(([ch, pct]) => (
                      <div key={ch} className="flex items-center justify-between text-sm">
                        <span>{channelLabels[ch] || ch}</span>
                        <Badge variant="outline">{typeof pct === 'number' ? pct : 0}%</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium mb-1">Raciocínio:</p>
                    <p className="text-muted-foreground">{aiSuggestion.reasoning}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <p className="font-medium mb-1 text-green-500">Impacto Esperado:</p>
                    <p className="text-muted-foreground">{aiSuggestion.expectedImpact}</p>
                  </div>
                  <Button className="w-full gap-2" onClick={applyAISuggestion}>
                    <TrendingUp className="h-4 w-4" /> Aplicar Sugestão
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
              <CardContent>
                {(budgets.data || []).length > 0 ? (
                  <div className="space-y-2">
                    {(budgets.data || []).slice(0, 5).map(b => (
                      <div key={b.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{b.month}</span>
                          <span>R$ {(b.totalBudget / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
