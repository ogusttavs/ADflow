import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function IntakeForm() {
  const { token } = useParams<{ token: string }>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading, error } = trpc.intake.getPublicForm.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const submitMut = trpc.intake.submitForm.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate required fields
    const missing = (form?.fields ?? []).filter(
      (f) => f.required && !values[f.id]?.trim()
    );
    if (missing.length > 0) return;

    submitMut.mutate({ token, responses: values });
  };

  // Already submitted in a previous session
  if (!isLoading && form?.submittedAt) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <h2 className="text-xl font-semibold">Formulário já respondido</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Este formulário já foi preenchido anteriormente. Obrigado!
          </p>
        </div>
      </PageShell>
    );
  }

  // Success after submitting
  if (submitted) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <h2 className="text-xl font-semibold">Enviado com sucesso!</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Suas respostas foram registradas. Obrigado por preencher o formulário.
          </p>
        </div>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (error || !form) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="text-xl font-semibold">Link inválido</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Este formulário não existe ou o link está incorreto.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold">{form.title || "Formulário de Onboarding"}</h1>
        {form.description && (
          <p className="text-muted-foreground text-sm">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {(form.fields ?? []).map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>

            {field.type === "textarea" ? (
              <Textarea
                id={field.id}
                name={field.id}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                rows={4}
                required={field.required}
              />
            ) : field.type === "select" && field.options ? (
              <Select
                value={values[field.id] ?? ""}
                onValueChange={(val) => setValues((v) => ({ ...v, [field.id]: val }))}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={field.placeholder || "Selecione..."} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.id}
                name={field.id}
                type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                required={field.required}
              />
            )}
          </div>
        ))}

        {submitMut.isError && (
          <p className="text-sm text-red-400">
            Ocorreu um erro ao enviar. Por favor, tente novamente.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitMut.isPending}>
          {submitMut.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
          ) : (
            "Enviar respostas"
          )}
        </Button>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-sm">AdFlow AI</span>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
