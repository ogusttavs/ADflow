import { useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle2, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const utils = trpc.useUtils();
  const hasTriggeredRef = useRef(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verificado com sucesso.");
      void utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!token || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    verifyEmailMutation.mutate({ token });
  }, [token, verifyEmailMutation]);

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-sm">
        <div className="surface-card rounded-2xl p-6">
          <h1 className="text-lg font-semibold">Verificação de email</h1>

          {!token ? (
            <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
              Link inválido ou ausente. Solicite um novo email de verificação dentro do app.
            </div>
          ) : verifyEmailMutation.isPending ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando seu link...
            </div>
          ) : verifyEmailMutation.isSuccess ? (
            <div className="mt-5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Seu email foi confirmado.
              </div>
            </div>
          ) : verifyEmailMutation.isError ? (
            <div className="mt-5 rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-300">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4" />
                Este link está inválido, expirado ou já foi utilizado.
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">Abrir aplicativo</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Ir para login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
