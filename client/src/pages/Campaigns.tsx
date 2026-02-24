import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Plus, Megaphone, Search, ArrowRight, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "status-pending",
  generating: "status-generating",
  review: "status-review",
  approved: "status-approved",
  published: "status-published",
  failed: "status-failed",
  scheduled: "status-scheduled",
  cancelled: "status-failed",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  generating: "Gerando IA",
  review: "Em Revisão",
  approved: "Aprovada",
  published: "Publicada",
  failed: "Falhou",
  scheduled: "Agendada",
  cancelled: "Cancelada",
};

const channelIcons: Record<string, string> = {
  web: "🌐",
  whatsapp: "💬",
  api: "🔌",
};

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const { data: campaigns, refetch } = trpc.campaigns.list.useQuery();
  const deleteCampaign = trpc.campaigns.delete.useMutation({
    onSuccess: () => { toast.success("Campanha removida."); refetch(); },
  });

  const filtered = (campaigns ?? []).filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Planejamento</p>
            <h1 className="page-title">Campanhas</h1>
            <p className="page-subtitle">{campaigns?.length ?? 0} campanhas no total</p>
          </div>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />Nova Campanha
            </Link>
          </Button>
        </div>

        <div className="surface-card p-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pages-campaigns-search"
              name="pages-campaigns-search"
              aria-label="Buscar campanhas"
              placeholder="Buscar campanhas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhuma campanha encontrada</p>
            <p className="text-sm mt-1">Crie sua primeira campanha com IA</p>
            <Button className="mt-4" asChild>
              <Link href="/campaigns/new"><Plus className="w-4 h-4 mr-2" />Criar Campanha</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((campaign) => (
              <Card key={campaign.id} className="bg-card border-border hover:border-primary/45 hover:shadow-sm hover:shadow-primary/10 transition-all group">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{campaign.title}</h3>
                        <span className="text-xs text-muted-foreground">{channelIcons[campaign.requestedVia ?? 'web'] ?? "🌐"}</span>
                      </div>
                      {campaign.objective && (
                        <p className="text-sm text-muted-foreground truncate">{campaign.objective}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(campaign.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                      {campaign.status === "generating" && (
                        <div className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300">
                          <Zap className="w-3 h-3 animate-pulse" />
                          <span>IA trabalhando...</span>
                        </div>
                      )}
                      <Badge className={`text-xs ${statusColors[campaign.status] ?? ""}`}>
                        {statusLabels[campaign.status] ?? campaign.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteCampaign.mutate({ id: campaign.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8" asChild>
                        <Link href={`/campaigns/${campaign.id}`}>
                          Ver <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
