import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  scheduled: "status-scheduled",
  published: "status-published",
  failed: "status-failed",
  cancelled: "status-failed",
  pending: "status-pending",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
  cancelled: "Cancelado",
  pending: "Pendente",
};

export default function Calendar() {
  const { data: posts, refetch } = trpc.social.listScheduledPosts.useQuery({});
  const publishNow = trpc.social.publishNow.useMutation({
    onSuccess: () => { toast.success("Post publicado!"); refetch(); },
  });
  const cancelPost = trpc.social.cancelPost.useMutation({
    onSuccess: () => { toast.success("Post cancelado."); refetch(); },
  });

  const grouped = (posts ?? []).reduce((acc: Record<string, typeof posts>, post) => {
    if (!post) return acc;
    const date = new Date(post.scheduledAt).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(post);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Calendário de Publicações</h1>
          <p className="text-muted-foreground text-sm mt-1">Posts agendados e histórico de publicações</p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum post agendado</p>
            <p className="text-sm mt-1">Crie campanhas e agende publicações nas redes sociais</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, datePosts]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 capitalize">{date}</h2>
                <div className="space-y-3">
                  {(datePosts ?? []).map((post) => post && (
                    <Card key={post.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[60px]">
                            <Clock className="w-3 h-3" />
                            {new Date(post.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">{post.platform}</Badge>
                              <Badge className={`text-xs ${statusColors[post.status] ?? ""}`}>
                                {statusLabels[post.status] ?? post.status}
                              </Badge>
                            </div>
                            <p className="text-sm line-clamp-2">{post.content}</p>
                          </div>
                          {post.status === "scheduled" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-green-400 border-green-500/30 hover:bg-green-500/10"
                                onClick={() => publishNow.mutate({ postId: post.id })}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />Publicar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground hover:text-destructive"
                                onClick={() => cancelPost.mutate({ id: post.id })}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
