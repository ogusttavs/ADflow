import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link2, Plus, Copy, ExternalLink, MousePointerClick } from "lucide-react";

export default function UTMBuilder() {
  const [showNew, setShowNew] = useState(false);
  const links = trpc.utm.list.useQuery({});
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    baseUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", utmContent: "",
  });

  const create = trpc.utm.create.useMutation({
    onSuccess: (data) => {
      utils.utm.list.invalidate();
      setShowNew(false);
      toast.success("Link UTM criado!");
      navigator.clipboard.writeText(data.fullUrl);
      toast.info("URL copiada para a área de transferência");
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const previewUrl = () => {
    if (!form.baseUrl) return "";
    const params = new URLSearchParams();
    if (form.utmSource) params.set("utm_source", form.utmSource);
    if (form.utmMedium) params.set("utm_medium", form.utmMedium);
    if (form.utmCampaign) params.set("utm_campaign", form.utmCampaign);
    if (form.utmTerm) params.set("utm_term", form.utmTerm);
    if (form.utmContent) params.set("utm_content", form.utmContent);
    const sep = form.baseUrl.includes("?") ? "&" : "?";
    return `${form.baseUrl}${sep}${params.toString()}`;
  };

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 className="h-6 w-6" /> UTM Builder</h1>
          <p className="text-muted-foreground">Crie e gerencie links UTM para rastreamento de campanhas</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Link UTM</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Link UTM</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>URL Base *</Label><Input value={form.baseUrl} onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))} placeholder="https://seusite.com.br/landing" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Source *</Label><Input value={form.utmSource} onChange={e => setForm(p => ({ ...p, utmSource: e.target.value }))} placeholder="instagram, facebook, google" /></div>
                <div><Label>Medium *</Label><Input value={form.utmMedium} onChange={e => setForm(p => ({ ...p, utmMedium: e.target.value }))} placeholder="social, cpc, email" /></div>
              </div>
              <div><Label>Campaign *</Label><Input value={form.utmCampaign} onChange={e => setForm(p => ({ ...p, utmCampaign: e.target.value }))} placeholder="black-friday-2026" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Term (opcional)</Label><Input value={form.utmTerm} onChange={e => setForm(p => ({ ...p, utmTerm: e.target.value }))} placeholder="palavra-chave" /></div>
                <div><Label>Content (opcional)</Label><Input value={form.utmContent} onChange={e => setForm(p => ({ ...p, utmContent: e.target.value }))} placeholder="banner-topo" /></div>
              </div>
              {form.baseUrl && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <p className="text-xs break-all font-mono">{previewUrl()}</p>
                </div>
              )}
              <Button className="w-full" onClick={() => create.mutate(form)} disabled={create.isPending || !form.baseUrl || !form.utmSource || !form.utmMedium || !form.utmCampaign}>
                {create.isPending ? "Criando..." : "Criar Link UTM"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Templates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Instagram", source: "instagram", medium: "social" },
          { label: "Facebook Ads", source: "facebook", medium: "cpc" },
          { label: "Google Ads", source: "google", medium: "cpc" },
          { label: "Email", source: "email", medium: "email" },
        ].map(t => (
          <Button key={t.label} variant="outline" className="h-auto py-3 flex-col" onClick={() => setForm(p => ({ ...p, utmSource: t.source, utmMedium: t.medium }))}>
            <span className="font-medium">{t.label}</span>
            <span className="text-xs text-muted-foreground">{t.source} / {t.medium}</span>
          </Button>
        ))}
      </div>

      {/* Links List */}
      <Card>
        <CardHeader><CardTitle>Links UTM Criados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(links.data || []).map(link => (
              <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{link.utmSource}</Badge>
                    <Badge variant="secondary">{link.utmMedium}</Badge>
                    <Badge>{link.utmCampaign}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">{link.fullUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center px-3">
                    <p className="text-sm font-bold">{link.clicks || 0}</p>
                    <p className="text-[10px] text-muted-foreground">cliques</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyUrl(link.fullUrl || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!links.data || links.data.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link UTM criado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
