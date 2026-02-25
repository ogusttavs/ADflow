import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso. Faça login novamente.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Link de recuperação inválido.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha os campos de senha.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da senha não confere.");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword,
    });
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-sm">
        <div className="surface-card rounded-2xl p-6">
          <h1 className="text-lg font-semibold">Criar nova senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina uma nova senha para sua conta.
          </p>

          {!token ? (
            <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
              Link inválido ou ausente. Solicite um novo email de recuperação.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-password-new">Nova senha</Label>
                <Input
                  id="reset-password-new"
                  name="reset-password-new"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={resetPasswordMutation.isPending}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-password-confirm">Confirmar nova senha</Label>
                <Input
                  id="reset-password-confirm"
                  name="reset-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={resetPasswordMutation.isPending}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

