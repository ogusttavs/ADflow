import { useState } from "react";
import { useParams } from "wouter";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Zap, Image, Copy, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const channelLabels: Record<string, string> = {
  instagram_feed: "Instagram Feed",
  instagram_stories: "Instagram Stories",
  instagram_reels: "Instagram Reels",
  facebook_feed: "Facebook Feed",
  facebook_stories: "Facebook Stories",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  email: "E-mail",
};

const statusColors: Record<string, string> = {
  pending: "status-pending",
  generating: "status-generating",
  review: "status-review",
  approved: "status-approved",
  published: "status-published",
  failed: "status-failed",
  scheduled: "status-scheduled",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  generating: "Gerando IA",
  review: "Em Revisão",
  approved: "Aprovada",
  published: "Publicada",
  failed: "Falhou",
  scheduled: "Agendada",
};

export default function CampaignDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const [generatingCreative, setGeneratingCreative] = useState(false);

  const { data: campaign, refetch } = trpc.campaigns.get.useQuery({ id }, { enabled: !!id });
  const approveCopy = trpc.campaigns.approveCopy.useMutation({
    onSuccess: () => { toast.success("Status atualizado."); refetch(); },
  });
  const generateCreative = trpc.ai.generateCreative.useMutation({
    onSuccess: () => { toast.success("Criativo gerado!"); refetch(); setGeneratingCreative(false); },
    onError: () => { toast.error("Erro ao gerar criativo."); setGeneratingCreative(false); },
  });
  const updateStatus = trpc.campaigns.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado."); refetch(); },
  });

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const handleGenerateCreative = () => {
    const prompt = campaign.copies?.[0]?.headline ?? campaign.title;
    setGeneratingCreative(true);
    generateCreative.mutate({
      campaignId: id,
      prompt: `Marketing visual for: ${prompt}. Campaign: ${campaign.title}`,
      style: "bold",
    });
  };

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-['Space_Grotesk']">{campaign.title}</h1>
              <Badge className={`text-xs ${statusColors[campaign.status] ?? ""}`}>
                {statusLabels[campaign.status] ?? campaign.status}
              </Badge>
            </div>
            {campaign.objective && (
              <p className="text-sm text-muted-foreground mt-1">{campaign.objective}</p>
            )}
          </div>
          {campaign.status === "review" && (
            <Button
              onClick={() => updateStatus.mutate({ id, status: "approved" })}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar Campanha
            </Button>
          )}
        </div>

        <Tabs defaultValue="strategy">
          <TabsList className="bg-muted">
            <TabsTrigger value="strategy">Estratégia</TabsTrigger>
            <TabsTrigger value="copies">Cópias ({campaign.copies?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="creatives">Criativos ({campaign.creatives?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          </TabsList>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            {campaign.strategy ? (
              <>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />Estratégia Gerada por IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{campaign.strategy}</p>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaign.keyMessages && (
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Mensagens-Chave</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{campaign.keyMessages}</p>
                      </CardContent>
                    </Card>
                  )}
                  {campaign.callToAction && (
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Call to Action</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium text-primary">{campaign.callToAction}</p>
                      </CardContent>
                    </Card>
                  )}
                  {campaign.suggestedHashtags && (
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hashtags Sugeridas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-primary">{campaign.suggestedHashtags}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Estratégia ainda não gerada.</p>
              </div>
            )}
          </TabsContent>

          {/* Copies Tab */}
          <TabsContent value="copies" className="space-y-4">
            {(campaign.copies ?? []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Copy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhuma cópia gerada ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaign.copies?.map((copy) => (
                  <Card key={copy.id} className={`bg-card border-border ${copy.approved ? "border-green-500/30" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {channelLabels[copy.channel] ?? copy.channel}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {copy.approved ? (
                            <Badge className="status-approved text-xs">Aprovada</Badge>
                          ) : (
                            <Badge className="status-review text-xs">Aguardando</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => approveCopy.mutate({ copyId: copy.id, approved: !copy.approved })}
                          >
                            {copy.approved ? (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {copy.headline && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Headline</p>
                          <p className="font-semibold">{copy.headline}</p>
                        </div>
                      )}
                      {copy.body && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Texto</p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{copy.body}</p>
                        </div>
                      )}
                      {copy.hashtags && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Hashtags</p>
                          <p className="text-sm text-primary">{copy.hashtags}</p>
                        </div>
                      )}
                      {copy.cta && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">CTA</p>
                          <p className="text-sm font-medium">{copy.cta}</p>
                        </div>
                      )}
                      {copy.characterCount && (
                        <p className="text-xs text-muted-foreground">{copy.characterCount} caracteres</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Creatives Tab */}
          <TabsContent value="creatives" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateCreative}
                disabled={generatingCreative}
                variant="outline"
              >
                {generatingCreative ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
                ) : (
                  <><Image className="w-4 h-4 mr-2" />Gerar Criativo com IA</>
                )}
              </Button>
            </div>
            {(campaign.creatives ?? []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum criativo gerado ainda.</p>
                <p className="text-sm mt-1">Clique em "Gerar Criativo com IA" para criar imagens automaticamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.creatives?.map((creative) => (
                  <Card key={creative.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      {creative.imageUrl ? (
                        <img
                          src={creative.imageUrl}
                          alt="Criativo"
                          className="w-full rounded-lg object-cover aspect-square mb-3"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                          <Image className="w-10 h-10 text-muted-foreground opacity-30" />
                        </div>
                      )}
                      {creative.prompt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{creative.prompt}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="text-xs capitalize">{creative.type}</Badge>
                        {creative.approved ? (
                          <Badge className="status-approved text-xs">Aprovado</Badge>
                        ) : (
                          <Badge className="status-review text-xs">Aguardando</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Agendamento de Publicações</p>
                <p className="text-sm mt-1">Configure as contas de redes sociais nas Integrações para agendar publicações.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/integrations">Configurar Integrações</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
