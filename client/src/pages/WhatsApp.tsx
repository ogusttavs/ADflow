import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Smartphone, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

export default function WhatsApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Olá! 👋 Sou o assistente de marketing da sua agência. Como posso ajudar você hoje?\n\nPosso criar campanhas completas com estratégia, textos e criativos para suas redes sociais. É só me dizer o que você precisa!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("+5511999999999");
  const [clientId, setClientId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: sessions } = trpc.whatsapp.sessions.useQuery();
  const simulateMessage = trpc.whatsapp.simulateMessage.useMutation();
  const { data: config } = trpc.whatsapp.getConfig.useQuery();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setIsSending(true);

    setMessages(prev => [...prev, {
      role: "user",
      content: userMsg,
      timestamp: new Date(),
    }]);

    try {
      const result = await simulateMessage.mutateAsync({
        phoneNumber: phone,
        message: userMsg,
        clientId: clientId ? parseInt(clientId) : undefined,
      });

      setMessages(prev => [...prev, {
        role: "bot",
        content: result.reply,
        timestamp: new Date(),
      }]);

      if (result.campaignCreated) {
        toast.success("Campanha criada via WhatsApp!");
      }
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copiada!");
  };

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">WhatsApp Bot</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
              Em breve
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Chatbot inteligente para receber solicitações de campanhas</p>
          <p className="text-xs text-muted-foreground mt-1">Esta funcionalidade requer aprovação da Meta Business API para funcionar com número real de WhatsApp.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulator */}
          <div className="lg:col-span-2 space-y-4">
            {/* Config */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Configuração do Simulador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-whatsapp-numero-de-teste">Número de Teste</Label>
                    <Input name="pages-whatsapp-numero-de-teste" id="pages-whatsapp-numero-de-teste"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+5511999999999"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-whatsapp-cliente-associado">Cliente Associado</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger id="pages-whatsapp-cliente-associado" aria-label="Cliente associado" className="bg-input border-border">
                        <SelectValue placeholder="Selecionar cliente..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(clients ?? []).map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Orbita Bot</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[oklch(0.13_0.01_240)]">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === "bot" ? "bg-green-500/15" : "bg-primary/15"
                      }`}>
                        {msg.role === "bot" ? (
                          <Bot className="w-4 h-4 text-green-400" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === "bot"
                          ? "bg-card border border-border rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.role === "bot" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                          {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="bg-card border border-border rounded-xl rounded-tl-none px-3 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    id="pages-whatsapp-mensagem"
                    name="pages-whatsapp-mensagem"
                    aria-label="Mensagem"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="bg-input border-border"
                    disabled={isSending}
                  />
                  <Button onClick={sendMessage} disabled={isSending || !input.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Webhook Config */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Webhook URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Configure este URL no Meta Business Manager para receber mensagens reais do WhatsApp Business API.</p>
                <div className="flex gap-2">
                  <Input
                    id="pages-whatsapp-webhook-url"
                    name="pages-whatsapp-webhook-url"
                    aria-label="Webhook URL"
                    value={`${window.location.origin}/api/whatsapp/webhook`}
                    readOnly
                    className="bg-input border-border text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sessões Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                {(sessions ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma sessão ainda</p>
                ) : (
                  <div className="space-y-2">
                    {sessions?.slice(0, 5).map(session => (
                      <div key={session.id} className="flex items-center gap-2 text-xs">
                        <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{session.phoneNumber}</span>
                        <Badge className={`text-[10px] ${session.state === "completed" ? "status-approved" : "status-pending"}`}>
                          {session.state}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Messages */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mensagens Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Quero criar uma campanha de lançamento de produto",
                  "Preciso de posts para o Instagram essa semana",
                  "Crie uma campanha para aumentar seguidores",
                  "Quero anunciar uma promoção no Facebook",
                ].map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(msg)}
                    className="w-full text-left text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {msg}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
