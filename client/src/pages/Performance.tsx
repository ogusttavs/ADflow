import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, MousePointerClick,
  Eye, Target, AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

export default function Performance() {
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const clients = trpc.clients.list.useQuery();

  const platformData = trpc.performance.getByPlatform.useQuery(
    { clientId: selectedClientId },
    { enabled: selectedClientId > 0 }
  );

  const platforms = useMemo(() => {
    if (!platformData.data) return [];
    return Object.entries(platformData.data).map(([name, data]) => ({
      name,
      ...data,
      ctr: data.impressions > 0 ? ((data.clicks / data.impressions) * 100) : 0,
      cpc: data.clicks > 0 ? (data.spend / data.clicks) : 0,
      cpa: data.conversions > 0 ? (data.spend / data.conversions) : 0,
      roas: data.spend > 0 ? (data.revenue / data.spend) : 0,
    }));
  }, [platformData.data]);

  const totals = useMemo(() => {
    return platforms.reduce((acc, p) => ({
      impressions: acc.impressions + p.impressions,
      clicks: acc.clicks + p.clicks,
      conversions: acc.conversions + p.conversions,
      spend: acc.spend + p.spend,
      revenue: acc.revenue + p.revenue,
    }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
  }, [platforms]);

  const totalCTR = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100) : 0;
  const totalCPA = totals.conversions > 0 ? (totals.spend / totals.conversions) : 0;
  const totalROAS = totals.spend > 0 ? (totals.revenue / totals.spend) : 0;

  // AI-powered alerts
  const alerts = useMemo(() => {
    const result: { type: "warning" | "danger" | "success"; message: string; platform: string }[] = [];
    for (const p of platforms) {
      if (p.ctr < 1) result.push({ type: "danger", message: `CTR muito baixo (${p.ctr.toFixed(2)}%). Considere revisar os criativos.`, platform: p.name });
      if (p.roas < 1 && p.spend > 0) result.push({ type: "warning", message: `ROAS abaixo de 1x (${p.roas.toFixed(2)}x). Investimento não está retornando.`, platform: p.name });
      if (p.roas > 3) result.push({ type: "success", message: `Excelente ROAS de ${p.roas.toFixed(2)}x! Considere aumentar o investimento.`, platform: p.name });
      if (p.cpa > 5000 && p.conversions > 0) result.push({ type: "warning", message: `CPA elevado (R$ ${(p.cpa / 100).toFixed(2)}). Otimize o público-alvo.`, platform: p.name });
    }
    return result;
  }, [platforms]);

  const platformIcons: Record<string, string> = {
    instagram: "📸", facebook: "📘", tiktok: "🎵", linkedin: "💼", youtube: "📺", google: "🔍",
  };

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Performance</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
              Em breve
            </span>
          </div>
          <p className="text-muted-foreground">Dashboard de ROAS, CPA, CTR e métricas por canal</p>
          <p className="text-xs text-muted-foreground mt-1">Métricas reais via Meta Ads API e Google Ads estão em desenvolvimento.</p>
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
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Selecione um cliente para ver a performance</p>
          <p className="text-sm">Os dados de ROAS, CPA e CTR serão exibidos por canal</p>
        </CardContent></Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Eye className="h-5 w-5 text-blue-500" />
                {totalCTR > 2 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-2xl font-bold mt-2">{totals.impressions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Impressões</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <MousePointerClick className="h-5 w-5 text-green-500" />
                <Badge variant={totalCTR > 2 ? "default" : "secondary"}>{totalCTR.toFixed(2)}% CTR</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{totals.clicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Cliques</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{totals.conversions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-red-500" />
                <Badge variant={totalCPA < 3000 ? "default" : "destructive"}>CPA R$ {(totalCPA / 100).toFixed(2)}</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">R$ {(totals.spend / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Investimento</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <Badge variant={totalROAS > 2 ? "default" : "secondary"}>{totalROAS.toFixed(2)}x ROAS</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">R$ {(totals.revenue / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Receita</p>
            </CardContent></Card>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Alertas Preditivos <Sparkles className="h-4 w-4 text-purple-500" /></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
                    alert.type === "danger" ? "bg-red-500/10 border-red-500/20" :
                    alert.type === "warning" ? "bg-yellow-500/10 border-yellow-500/20" :
                    "bg-green-500/10 border-green-500/20"
                  }`}>
                    {alert.type === "danger" ? <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" /> :
                     alert.type === "warning" ? <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" /> :
                     <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{platformIcons[alert.platform] || "📊"} {alert.platform}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Per Platform */}
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">Performance por Canal</h2>
            {platforms.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map(p => (
                  <Card key={p.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xl">{platformIcons[p.name] || "📊"}</span>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold">{p.impressions.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Impressões</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold">{p.clicks.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Cliques</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold">{p.ctr.toFixed(2)}%</p>
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold">R$ {(p.cpc / 100).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">CPC</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold">R$ {(p.cpa / 100).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">CPA</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className={`text-lg font-bold ${p.roas >= 2 ? "text-green-500" : p.roas >= 1 ? "text-yellow-500" : "text-red-500"}`}>{p.roas.toFixed(2)}x</p>
                          <p className="text-[10px] text-muted-foreground">ROAS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum dado de performance registrado para este cliente.</p>
                <p className="text-sm mt-1">Adicione métricas manualmente ou conecte as APIs de anúncios.</p>
              </CardContent></Card>
            )}
          </div>
        </>
      )}
    </div>
    </AppLayout>
  );
}
