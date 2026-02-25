import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Megaphone, MessageSquare, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, React.ElementType> = {
  campaign_created: Megaphone,
  campaign_generated: Zap,
  whatsapp_request: MessageSquare,
  publish_success: CheckCheck,
  publish_failed: AlertCircle,
};

const typeColors: Record<string, string> = {
  campaign_created: "text-primary bg-primary/15",
  campaign_generated: "text-green-400 bg-green-500/15",
  whatsapp_request: "text-blue-400 bg-blue-500/15",
  publish_success: "text-green-400 bg-green-500/15",
  publish_failed: "text-destructive bg-destructive/15",
};

export default function Notifications() {
  const { data: notifs, refetch } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("Todas marcadas como lidas."); refetch(); },
  });

  const unread = (notifs ?? []).filter(n => !n.read).length;

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Notificações</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unread > 0 ? `${unread} não lida${unread > 1 ? "s" : ""}` : "Tudo em dia"}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {(notifs ?? []).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhuma notificação</p>
            <p className="text-sm mt-1">Avisos de rotina, CRM e financeiro aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs?.map(notif => {
              const Icon = typeIcons[notif.type ?? ""] ?? Bell;
              const colorClass = typeColors[notif.type ?? ""] ?? "text-muted-foreground bg-muted";
              return (
                <Card
                  key={notif.id}
                  className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/30 ${!notif.read ? "border-primary/20 bg-primary/5" : ""}`}
                  onClick={() => !notif.read && markRead.mutate({ id: notif.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        {notif.message && (
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
