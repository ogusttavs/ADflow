import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidTaxId } from "@shared/taxId";

export default function ForgotEmail() {
  const [taxId, setTaxId] = useState("");
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);

  const recoverEmailMutation = trpc.auth.recoverEmailByTaxId.useMutation({
    onSuccess: (result) => {
      setRecoveredEmail(result.email);
      toast.success("Email encontrado.");
    },
    onError: (error) => {
      setRecoveredEmail(null);
      toast.error(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taxId.trim()) {
      toast.error("Informe seu CPF ou CNPJ.");
      return;
    }
    if (!isValidTaxId(taxId)) {
      toast.error("CPF/CNPJ inválido. Verifique os dígitos informados.");
      return;
    }

    recoverEmailMutation.mutate({
      taxId: taxId.trim(),
    });
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-sm">
        <div className="surface-card rounded-2xl p-6">
          <h1 className="text-lg font-semibold">Recuperar email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informe o CPF/CNPJ cadastrado para localizar seu email de acesso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email-tax-id">CPF ou CNPJ</Label>
              <Input
                id="forgot-email-tax-id"
                name="forgot-email-tax-id"
                type="text"
                placeholder="Somente números ou formatado"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                disabled={recoverEmailMutation.isPending}
                autoComplete="off"
              />
            </div>

            {recoveredEmail ? (
              <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                <p className="text-xs text-muted-foreground">Email encontrado:</p>
                <p className="text-sm font-medium break-all">{recoveredEmail}</p>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={recoverEmailMutation.isPending}>
              {recoverEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Localizar email"
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Voltar para login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
