import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

type Tab = "login" | "register";

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Preencha email e senha");
      return;
    }
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    registerMutation.mutate(registerForm);
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk']">AdFlow</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Entrar na sua central de operação</p>
        </div>

        {/* Card */}
        <div className="surface-card rounded-2xl p-6">
          {/* Tabs */}
          <div className="mb-6 flex rounded-lg border border-border/70 bg-muted/70 p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Nome</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Seu nome"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Senha</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                O primeiro usuário criado recebe permissão de admin.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
