import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Star, Plus, Trash2, Pencil, Upload, Link, ImageOff } from "lucide-react";

type DreamForm = {
  title: string;
  description: string;
  imageBase64: string;
  imageUrl: string;
  imageTab: "upload" | "url";
};

const EMPTY_FORM: DreamForm = {
  title: "",
  description: "",
  imageBase64: "",
  imageUrl: "",
  imageTab: "upload",
};

export default function Dreams() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DreamForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: dreams, refetch } = trpc.dreams.list.useQuery();

  const createMut = trpc.dreams.create.useMutation({
    onSuccess: () => { refetch(); closeDialog(); toast.success("Sonho adicionado!"); },
    onError: (e) => toast.error(e.message || "Erro ao criar"),
  });
  const updateMut = trpc.dreams.update.useMutation({
    onSuccess: () => { refetch(); closeDialog(); toast.success("Sonho atualizado!"); },
    onError: (e) => toast.error(e.message || "Erro ao atualizar"),
  });
  const deleteMut = trpc.dreams.delete.useMutation({
    onSuccess: () => { refetch(); setConfirmDelete(null); toast.success("Removido"); },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (d: typeof dreams extends (infer T)[] | undefined ? T : never) => {
    if (!d) return;
    setEditId(d.id);
    setForm({
      title: d.title,
      description: d.description ?? "",
      imageBase64: d.imageBase64 ?? "",
      imageUrl: d.imageUrl ?? "",
      imageTab: d.imageBase64 ? "upload" : "url",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, imageBase64: reader.result as string, imageUrl: "" }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("Informe o título"); return; }
    const payload = {
      title: form.title,
      description: form.description || undefined,
      imageBase64: form.imageBase64 || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    if (editId !== null) {
      updateMut.mutate({ id: editId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const getImage = (d: { imageBase64?: string | null; imageUrl?: string | null }) =>
    d.imageBase64 || d.imageUrl || null;

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Pessoal</p>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              <h1 className="page-title">Quadro dos Sonhos</h1>
            </div>
            <p className="page-subtitle">Registre seus sonhos e objetivos de vida</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={openNew}>
            <Plus className="w-4 h-4" />Adicionar Sonho
          </Button>
        </div>

        {(dreams ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-4">
            <Star className="w-14 h-14 opacity-20" />
            <p className="text-base font-medium">Seu quadro de sonhos está vazio</p>
            <p className="text-sm max-w-xs">Adicione seus sonhos, objetivos e aspirações de vida. Visualizá-los ajuda a realizá-los!</p>
            <Button className="gap-2 mt-2" onClick={openNew}>
              <Plus className="w-4 h-4" />Adicionar primeiro sonho
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(dreams ?? []).map(dream => {
              const img = getImage(dream);
              return (
                <div key={dream.id}
                  className="group relative rounded-xl overflow-hidden border bg-card hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openEdit(dream)}>
                  {/* Image area */}
                  <div className="aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                    {img ? (
                      <img src={img} alt={dream.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{dream.title}</p>
                    {dream.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{dream.description}</p>
                    )}
                  </div>
                  {/* Delete button */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(dream.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit/New Dialog */}
        <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                {editId !== null ? "Editar Sonho" : "Novo Sonho"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Título *</Label>
                <Input className="mt-1" placeholder="Ex: Viajar para o Japão" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea className="mt-1 resize-none min-h-20" placeholder="Descreva seu sonho..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Image picker */}
              <div>
                <Label>Imagem</Label>
                <Tabs value={form.imageTab} onValueChange={v => setForm(f => ({ ...f, imageTab: v as "upload" | "url" }))}
                  className="mt-1">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />Upload</TabsTrigger>
                    <TabsTrigger value="url" className="gap-1.5 text-xs"><Link className="w-3.5 h-3.5" />URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2 space-y-2">
                    <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                      <Upload className="w-4 h-4" />
                      {form.imageBase64 ? "Trocar imagem" : "Selecionar imagem"}
                    </Button>
                    {form.imageBase64 && (
                      <div className="rounded-lg overflow-hidden aspect-video">
                        <img src={form.imageBase64} className="w-full h-full object-cover" alt="preview" />
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">Máx 5 MB · JPG, PNG, WebP</p>
                  </TabsContent>
                  <TabsContent value="url" className="mt-2 space-y-2">
                    <Input placeholder="https://..." value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value, imageBase64: "" }))} />
                    {form.imageUrl && (
                      <div className="rounded-lg overflow-hidden aspect-video">
                        <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview"
                          onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={isPending || !form.title.trim()}>
                {isPending ? "Salvando..." : editId !== null ? "Salvar alterações" : "Adicionar sonho"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDelete !== null} onOpenChange={v => { if (!v) setConfirmDelete(null); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Remover sonho?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1"
                onClick={() => confirmDelete !== null && deleteMut.mutate({ id: confirmDelete })}
                disabled={deleteMut.isPending}>
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
