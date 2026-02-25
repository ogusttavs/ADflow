import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Se o email existir, enviaremos um link de recuperação.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu email.");
      return;
    }

    forgotPasswordMutation.mutate({ email: email.trim() });
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-sm">
        <div className="surface-card rounded-2xl p-6">
          <h1 className="text-lg font-semibold">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seu email para receber o link de redefinição.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-password-email">Email</Label>
              <Input
                id="forgot-password-email"
                name="forgot-password-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={forgotPasswordMutation.isPending}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link"
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

