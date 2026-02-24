import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ExternalLink, Key, Plug } from "lucide-react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "coming_soon";
  docsUrl?: string;
  configKey?: string;
}

const integrations: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "Receba solicitações de campanhas via WhatsApp e envie notificações automáticas.",
    icon: "💬",
    category: "Comunicação",
    status: "connected",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    configKey: "WHATSAPP_TOKEN",
  },
  {
    id: "instagram",
    name: "Instagram Graph API",
    description: "Publique fotos, stories e reels automaticamente no Instagram.",
    icon: "📸",
    category: "Redes Sociais",
    status: "disconnected",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    configKey: "INSTAGRAM_ACCESS_TOKEN",
  },
  {
    id: "facebook",
    name: "Facebook Pages API",
    description: "Publique posts e stories no Facebook automaticamente.",
    icon: "👍",
    category: "Redes Sociais",
    status: "disconnected",
    docsUrl: "https://developers.facebook.com/docs/pages",
    configKey: "FACEBOOK_ACCESS_TOKEN",
  },
  {
    id: "tiktok",
    name: "TikTok Content Posting API",
    description: "Publique vídeos e fotos no TikTok automaticamente.",
    icon: "🎵",
    category: "Redes Sociais",
    status: "disconnected",
    docsUrl: "https://developers.tiktok.com/doc/content-posting-api-get-started",
    configKey: "TIKTOK_ACCESS_TOKEN",
  },
  {
    id: "linkedin",
    name: "LinkedIn Marketing API",
    description: "Publique posts e artigos no LinkedIn automaticamente.",
    icon: "💼",
    category: "Redes Sociais",
    status: "disconnected",
    docsUrl: "https://developer.linkedin.com/",
    configKey: "LINKEDIN_ACCESS_TOKEN",
  },
  {
    id: "freepik",
    name: "Freepik API",
    description: "Gere e busque imagens e vetores profissionais para seus criativos.",
    icon: "🎨",
    category: "Criativos",
    status: "disconnected",
    docsUrl: "https://docs.freepik.com/",
    configKey: "FREEPIK_API_KEY",
  },
  {
    id: "n8n",
    name: "n8n Webhooks",
    description: "Conecte fluxos de automação do n8n para orquestrar campanhas complexas.",
    icon: "⚡",
    category: "Automação",
    status: "disconnected",
    configKey: "N8N_WEBHOOK_URL",
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    description: "Use o ChatGPT como modelo alternativo para geração de cópias.",
    icon: "🤖",
    category: "IA",
    status: "coming_soon",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description: "Use o Claude como modelo de IA para estratégias e cópias avançadas.",
    icon: "🧠",
    category: "IA",
    status: "coming_soon",
  },
];

const categories = Array.from(new Set(integrations.map(i => i.category)));

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = integrations.filter(i =>
    selectedCategory === "Todos" || i.category === selectedCategory
  );

  const saveApiKey = async (integrationId: string, key: string) => {
    setSaving(integrationId);
    // In production, this would save to server secrets
    await new Promise(r => setTimeout(r, 800));
    toast.success(`Chave de API salva para ${integrations.find(i => i.id === integrationId)?.name}!`);
    setSaving(null);
  };

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Integrações</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
              Em breve
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Conecte APIs externas para publicação automática e geração de conteúdo</p>
          <p className="text-xs text-muted-foreground mt-1">A conexão real com redes sociais (Instagram, TikTok, Meta Ads) está em desenvolvimento.</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {["Todos", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration) => (
            <Card key={integration.id} className={`bg-card border-border ${integration.status === "connected" ? "border-green-500/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{integration.name}</h3>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{integration.category}</Badge>
                    </div>
                  </div>
                  {integration.status === "connected" ? (
                    <Badge className="status-approved text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />Conectado
                    </Badge>
                  ) : integration.status === "coming_soon" ? (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Em breve</Badge>
                  ) : (
                    <Badge className="status-failed text-xs flex items-center gap-1">
                      <XCircle className="w-3 h-3" />Desconectado
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-4">{integration.description}</p>

                {integration.status !== "coming_soon" && integration.configKey && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-muted-foreground" />
                      <Label htmlFor={`pages-integrations-${integration.id}-api-key`} className="text-xs text-muted-foreground">
                        {integration.configKey}
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={`pages-integrations-${integration.id}-api-key`}
                        name={`pages-integrations-${integration.id}-api-key`}
                        type="password"
                        placeholder="sk-..."
                        value={apiKeys[integration.id] ?? ""}
                        onChange={e => setApiKeys(prev => ({ ...prev, [integration.id]: e.target.value }))}
                        className="bg-input border-border text-xs h-8"
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={saving === integration.id || !apiKeys[integration.id]}
                        onClick={() => saveApiKey(integration.id, apiKeys[integration.id] ?? "")}
                      >
                        {saving === integration.id ? "..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                )}

                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver documentação
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
