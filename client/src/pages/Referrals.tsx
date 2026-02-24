import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, Copy, Send, Users, DollarSign, Clock, CheckCircle2 } from "lucide-react";

export default function Referrals() {
  const [email, setEmail] = useState("");
  const myReferrals = trpc.referrals.myReferrals.useQuery();
  const myCode = trpc.referrals.getMyCode.useQuery();
  const stats = trpc.referrals.stats.useQuery();
  const utils = trpc.useUtils();

  const invite = trpc.referrals.invite.useMutation({
    onSuccess: () => {
      utils.referrals.myReferrals.invalidate();
      utils.referrals.stats.invalidate();
      setEmail("");
      toast.success("Convite enviado!");
    },
  });

  const copyCode = () => {
    if (myCode.data?.code) {
      navigator.clipboard.writeText(myCode.data.code);
      toast.success("Código copiado!");
    }
  };

  return (
    <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6" /> Programa de Indicação</h1>
        <p className="text-muted-foreground">Indique amigos e ganhe créditos na plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{stats.data?.total || 0}</p>
          <p className="text-xs text-muted-foreground">Total Indicações</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold">{stats.data?.pending || 0}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{stats.data?.converted || 0}</p>
          <p className="text-xs text-muted-foreground">Convertidas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold">R$ {((stats.data?.totalRewards || 0) / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total em Créditos</p>
        </CardContent></Card>
      </div>

      {/* Referral Code & Invite */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Seu Código de Indicação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold font-mono tracking-wider">{myCode.data?.code || "..."}</p>
              </div>
              <Button variant="outline" size="icon" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground">Compartilhe este código com amigos. Cada indicação convertida gera R$ 50,00 em créditos.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Convidar por Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Button className="gap-2" onClick={() => invite.mutate({ email })} disabled={invite.isPending || !email}>
                <Send className="h-4 w-4" /> Enviar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">O convidado receberá um email com seu código de indicação e um link para se cadastrar.</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader><CardTitle>Minhas Indicações</CardTitle></CardHeader>
        <CardContent>
          {(myReferrals.data || []).length > 0 ? (
            <div className="space-y-2">
              {(myReferrals.data || []).map(ref => (
                <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ref.referredEmail}</p>
                    <p className="text-xs text-muted-foreground">Código: {ref.code} · {new Date(ref.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ref.status === "converted" ? "default" : ref.status === "pending" ? "secondary" : "outline"}>
                      {ref.status === "converted" ? "Convertida" : ref.status === "pending" ? "Pendente" : ref.status}
                    </Badge>
                    {ref.status === "converted" && <span className="text-sm font-medium text-green-500">+R$ {((ref.rewardValue || 0) / 100).toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma indicação ainda</p>
              <p className="text-sm">Convide amigos e comece a ganhar créditos!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
