import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Sparkles, Trophy, BarChart3 } from "lucide-react";

export default function ABTests() {
  const [showNew, setShowNew] = useState(false);
  const tests = trpc.abTests.list.useQuery({});
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    campaignId: 0, name: "", channel: "instagram_feed",
    originalHeadline: "", originalBody: "", originalCta: "",
  });

  const generate = trpc.abTests.generateVariants.useMutation({
    onSuccess: () => {
      utils.abTests.list.invalidate();
      setShowNew(false);
      toast.success("Teste A/B criado com variantes geradas por IA!");
    },
    onError: () => toast.error("Erro ao gerar variantes"),
  });

  const declareWinner = trpc.abTests.declareWinner.useMutation({
    onSuccess: () => {
      utils.abTests.list.invalidate();
      toast.success("Vencedor declarado!");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "running": return "default";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  const calcCTR = (clicks: number | null, impressions: number | null) => {
    const c = clicks || 0;
    const i = impressions || 0;
    return i > 0 ? ((c / i) * 100).toFixed(2) : "0.00";
  };

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6" /> Testes A/B</h1>
          <p className="text-muted-foreground">Teste variantes de cópias e criativos gerados por IA</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Teste A/B</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Teste A/B com IA</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome do Teste</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Teste headline Black Friday" /></div>
                <div><Label>ID da Campanha</Label><Input type="number" value={form.campaignId || ""} onChange={e => setForm(p => ({ ...p, campaignId: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
                    <SelectItem value="instagram_stories">Instagram Stories</SelectItem>
                    <SelectItem value="facebook_feed">Facebook Feed</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Headline (Variante A)</Label><Input value={form.originalHeadline} onChange={e => setForm(p => ({ ...p, originalHeadline: e.target.value }))} /></div>
              <div><Label>Corpo (Variante A)</Label><Textarea value={form.originalBody} onChange={e => setForm(p => ({ ...p, originalBody: e.target.value }))} /></div>
              <div><Label>CTA (Variante A)</Label><Input value={form.originalCta} onChange={e => setForm(p => ({ ...p, originalCta: e.target.value }))} /></div>
              <Button className="w-full gap-2" onClick={() => generate.mutate(form)} disabled={generate.isPending || !form.name || !form.originalHeadline}>
                {generate.isPending ? "Gerando Variante B com IA..." : <><Sparkles className="h-4 w-4" /> Gerar Variante B com IA</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests Grid */}
      <div className="grid gap-4">
        {(tests.data || []).map(test => (
          <Card key={test.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(test.status)}>{test.status}</Badge>
                  {test.winner && <Badge className="gap-1"><Trophy className="h-3 w-3" />Vencedor: {test.winner}</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Canal: {test.channel} | Campanha #{test.campaignId}</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Variant A */}
                <div className={`border rounded-lg p-4 ${test.winner === "A" ? "border-green-500 bg-green-500/5" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Variante A</h4>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Headline:</span> {test.variantAHeadline}</p>
                    <p className="line-clamp-2"><span className="text-muted-foreground">Corpo:</span> {test.variantABody}</p>
                    <p><span className="text-muted-foreground">CTA:</span> {test.variantACta}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{test.variantAImpressions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Impressões</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{test.variantAClicks || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Cliques</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{calcCTR(test.variantAClicks, test.variantAImpressions)}%</p>
                      <p className="text-[10px] text-muted-foreground">CTR</p>
                    </div>
                  </div>
                  {!test.winner && test.status !== "completed" && (
                    <Button variant="outline" size="sm" className="w-full mt-3 gap-1"
                      onClick={() => declareWinner.mutate({ id: test.id, winner: "A" })}>
                      <Trophy className="h-3 w-3" /> Declarar Vencedor
                    </Button>
                  )}
                </div>

                {/* Variant B */}
                <div className={`border rounded-lg p-4 ${test.winner === "B" ? "border-green-500 bg-green-500/5" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-1">Variante B <Sparkles className="h-3 w-3 text-purple-500" /></h4>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Headline:</span> {test.variantBHeadline}</p>
                    <p className="line-clamp-2"><span className="text-muted-foreground">Corpo:</span> {test.variantBBody}</p>
                    <p><span className="text-muted-foreground">CTA:</span> {test.variantBCta}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{test.variantBImpressions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Impressões</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{test.variantBClicks || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Cliques</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-lg font-bold">{calcCTR(test.variantBClicks, test.variantBImpressions)}%</p>
                      <p className="text-[10px] text-muted-foreground">CTR</p>
                    </div>
                  </div>
                  {!test.winner && test.status !== "completed" && (
                    <Button variant="outline" size="sm" className="w-full mt-3 gap-1"
                      onClick={() => declareWinner.mutate({ id: test.id, winner: "B" })}>
                      <Trophy className="h-3 w-3" /> Declarar Vencedor
                    </Button>
                  )}
                </div>
              </div>
              {test.aiInsights && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm"><Sparkles className="h-3 w-3 inline mr-1 text-purple-500" /><span className="font-medium">Insight da IA:</span> {test.aiInsights}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {(!tests.data || tests.data.length === 0) && (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum teste A/B criado</p>
            <p className="text-sm">Crie um teste para comparar variantes de cópias geradas por IA</p>
          </CardContent></Card>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
