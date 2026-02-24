import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Sparkles, TrendingUp, BarChart3, Calendar } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Reports() {
  const [showNew, setShowNew] = useState(false);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const reports = trpc.reports.list.useQuery();
  const report = trpc.reports.get.useQuery({ id: selectedReport! }, { enabled: !!selectedReport });
  const utils = trpc.useUtils();

  const [form, setForm] = useState({ title: "", type: "performance", period: "Último mês", clientId: 0 });

  const generate = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      utils.reports.list.invalidate();
      setShowNew(false);
      setSelectedReport(data.id);
      toast.success("Relatório gerado com IA!");
    },
    onError: () => toast.error("Erro ao gerar relatório"),
  });

  if (selectedReport && report.data) {
    const r = report.data;
    const metrics = (r.metricsData || {}) as Record<string, number>;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedReport(null)}>← Voltar</Button>
          <h1 className="text-2xl font-bold">{r.title}</h1>
          <Badge variant="outline">{r.type}</Badge>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{metrics.totalCampaigns || 0}</p>
            <p className="text-xs text-muted-foreground">Campanhas</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{metrics.totalImpressions || 0}</p>
            <p className="text-xs text-muted-foreground">Impressões</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{metrics.totalClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Cliques</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{metrics.totalConversions || 0}</p>
            <p className="text-xs text-muted-foreground">Conversões</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" /> Resumo Executivo (IA)</CardTitle></CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <Streamdown>{r.aiSummary || "Sem resumo disponível"}</Streamdown>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /> Recomendações (IA)</CardTitle></CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <Streamdown>{r.aiRecommendations || "Sem recomendações disponíveis"}</Streamdown>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Relatórios</h1>
          <p className="text-muted-foreground">Relatórios automáticos de performance com insights de IA</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Gerar Relatório</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Gerar Relatório com IA</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Relatório Mensal de Performance" /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance Geral</SelectItem>
                    <SelectItem value="campaigns">Campanhas</SelectItem>
                    <SelectItem value="social">Redes Sociais</SelectItem>
                    <SelectItem value="roi">ROI / ROAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Período</Label>
                <Select value={form.period} onValueChange={v => setForm(p => ({ ...p, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Última semana">Última semana</SelectItem>
                    <SelectItem value="Último mês">Último mês</SelectItem>
                    <SelectItem value="Último trimestre">Último trimestre</SelectItem>
                    <SelectItem value="Último ano">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>ID do Cliente (opcional)</Label><Input type="number" value={form.clientId || ""} onChange={e => setForm(p => ({ ...p, clientId: parseInt(e.target.value) || 0 }))} /></div>
              <Button className="w-full gap-2" onClick={() => generate.mutate({ ...form, clientId: form.clientId || undefined })}
                disabled={generate.isPending || !form.title}>
                {generate.isPending ? "Gerando com IA..." : <><Sparkles className="h-4 w-4" /> Gerar Relatório com IA</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {(reports.data || []).map(r => (
          <Card key={r.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedReport(r.id)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.period} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{r.type}</Badge>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        ))}
        {(!reports.data || reports.data.length === 0) && (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum relatório gerado</p>
            <p className="text-sm">Gere relatórios automáticos com insights de IA</p>
          </CardContent></Card>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
