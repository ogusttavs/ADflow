import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useForm, Controller } from "react-hook-form";

const CHANNELS = [
  { id: "instagram_feed", label: "Instagram Feed", icon: "📸" },
  { id: "instagram_stories", label: "Instagram Stories", icon: "⭕" },
  { id: "instagram_reels", label: "Instagram Reels", icon: "🎬" },
  { id: "facebook_feed", label: "Facebook Feed", icon: "👍" },
  { id: "facebook_stories", label: "Facebook Stories", icon: "📱" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
];

interface CampaignForm {
  clientId: string;
  title: string;
  objective: string;
  channels: string[];
  autoGenerate: boolean;
}

export default function NewCampaign() {
  const [, navigate] = useLocation();
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["instagram_feed", "instagram_stories"]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: clients } = trpc.clients.list.useQuery();
  const createCampaign = trpc.campaigns.create.useMutation();
  const generateCampaign = trpc.campaigns.generate.useMutation();

  const { register, handleSubmit, control, watch } = useForm<CampaignForm>({
    defaultValues: { autoGenerate: true },
  });

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: CampaignForm) => {
    if (!data.clientId) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Selecione pelo menos um canal.");
      return;
    }

    try {
      setIsGenerating(true);
      const { id } = await createCampaign.mutateAsync({
        clientId: parseInt(data.clientId),
        title: data.title,
        objective: data.objective,
        requestedVia: "web",
      });

      if (data.autoGenerate) {
        toast.info("Gerando estratégia e cópias com IA...");
        await generateCampaign.mutateAsync({
          campaignId: id,
          channels: selectedChannels,
        });
        toast.success("Campanha gerada com sucesso! Revise as cópias.");
      } else {
        toast.success("Campanha criada!");
      }
      navigate(`/campaigns/${id}`);
    } catch (err) {
      toast.error("Erro ao criar campanha.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-content max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Nova Campanha</h1>
            <p className="text-muted-foreground text-sm">A IA vai gerar estratégia, cópias e criativos automaticamente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Controller name="clientId" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(clients ?? []).map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} {c.company ? `— ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Título da Campanha *</Label>
                <Input
                  {...register("title", { required: true })}
                  placeholder="Ex: Lançamento Produto X - Janeiro 2025"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo da Campanha</Label>
                <Textarea
                  {...register("objective")}
                  placeholder="Ex: Aumentar vendas do produto X em 30%, gerar leads qualificados, lançar nova linha..."
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Channels */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Canais de Publicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-sm ${
                      selectedChannels.includes(ch.id)
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{ch.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{ch.label}</span>
                  </button>
                ))}
              </div>
              {selectedChannels.length === 0 && (
                <p className="text-xs text-destructive mt-2">Selecione pelo menos um canal</p>
              )}
            </CardContent>
          </Card>

          {/* AI Generation */}
          <Card className="bg-card border-border border-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Geração Automática com IA</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A IA vai criar automaticamente: estratégia completa, cópias para cada canal selecionado e sugestão de criativo visual baseados nos dados pré-definidos do cliente.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      id="autoGenerate"
                      {...register("autoGenerate")}
                      defaultChecked
                      className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="autoGenerate" className="text-sm font-medium cursor-pointer">
                      Gerar estratégia e cópias automaticamente
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/campaigns">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
