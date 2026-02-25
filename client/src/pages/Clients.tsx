import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Plus, Users, Search, Building2, Phone, Mail, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface ClientForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  industry: string;
  website: string;
  status: "active" | "inactive" | "pending";
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente",
};

const statusColors: Record<string, string> = {
  active: "status-approved",
  inactive: "status-failed",
  pending: "status-pending",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<ClientForm>({
    defaultValues: { status: "active" },
  });

  const { data: clients, refetch } = trpc.clients.list.useQuery();
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      setOpen(false);
      reset();
      refetch();
    },
    onError: () => toast.error("Erro ao criar cliente."),
  });
  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => { toast.success("Cliente removido."); refetch(); },
  });

  const filtered = (clients ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: ClientForm) => createClient.mutate(data);

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Relacionamento</p>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">{clients?.length ?? 0} clientes cadastrados</p>
          </div>
          <div className="page-actions">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle>Adicionar Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-nome">Nome *</Label>
                    <Input id="pages-clients-nome" {...register("name", { required: true })} placeholder="João Silva" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-empresa">Empresa</Label>
                    <Input id="pages-clients-empresa" {...register("company")} placeholder="Empresa Ltda" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-e-mail">E-mail</Label>
                    <Input id="pages-clients-e-mail" {...register("email")} type="email" placeholder="email@empresa.com" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-telefone">Telefone</Label>
                    <Input id="pages-clients-telefone" {...register("phone")} placeholder="+55 11 99999-9999" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-whatsapp">WhatsApp</Label>
                    <Input id="pages-clients-whatsapp" {...register("whatsappNumber")} placeholder="+5511999999999" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages-clients-setor">Setor</Label>
                    <Input id="pages-clients-setor" {...register("industry")} placeholder="E-commerce, Saúde..." className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="pages-clients-website">Website</Label>
                    <Input id="pages-clients-website" {...register("website")} placeholder="https://empresa.com.br" className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="pages-clients-status">Status</Label>
                    <Select defaultValue="active" onValueChange={(v) => setValue("status", v as any)}>
                      <SelectTrigger id="pages-clients-status" aria-label="Status do cliente" className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createClient.isPending}>
                    {createClient.isPending ? "Criando..." : "Criar Cliente"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="surface-card p-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pages-clients-search"
              name="pages-clients-search"
              aria-label="Buscar clientes"
              placeholder="Buscar clientes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Adicione seu primeiro cliente para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Card key={client.id} className="bg-card border-border hover:border-primary/45 hover:shadow-sm hover:shadow-primary/10 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{client.name.charAt(0)}</span>
                    </div>
                    <Badge className={`text-xs ${statusColors[client.status]}`}>
                      {statusLabels[client.status]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{client.name}</h3>
                  {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                  <div className="mt-3 space-y-1.5">
                    {client.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />{client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{client.phone}
                      </div>
                    )}
                    {client.industry && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" />{client.industry}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                      onClick={() => deleteClient.mutate({ id: client.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={`/clients/${client.id}`}>
                        Ver detalhes <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
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
