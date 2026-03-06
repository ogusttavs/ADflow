import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Loader2, Chrome } from "lucide-react";
import { getStartPageRoute } from "@/lib/user-settings";
import { storePendingCheckoutContext } from "@/lib/checkoutContext";
import { getPlanCard } from "@/lib/planCatalog";
import { formatTaxId, onlyDigits } from "@/lib/profileCompletion";
import { getPasswordPolicyError } from "@shared/passwordPolicy";
import { isValidTaxId } from "@shared/taxId";
import { ORBITA_PLAN_VALUES, type OrbitaPlan } from "@shared/planAccess";

type Tab = "login" | "register";

function getSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function readTabFromSearch(): Tab | null {
  const tab = getSearchParams().get("tab");
  if (tab === "login" || tab === "register") return tab;
  return null;
}

function readCheckoutPlanFromSearch(): OrbitaPlan | null {
  const params = getSearchParams();
  if (params.get("checkout") !== "1") return null;
  const plan = params.get("plan");
  if (!plan) return null;
  if ((ORBITA_PLAN_VALUES as readonly string[]).includes(plan)) {
    return plan as OrbitaPlan;
  }
  return null;
}

export default function Login() {
  const [tab, setTab] = useState<Tab>(() => readTabFromSearch() ?? "login");
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<OrbitaPlan | null>(() =>
    readCheckoutPlanFromSearch(),
  );

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsappLocal: "",
    taxId: "",
    password: "",
    passwordConfirm: "",
  });

  const loginMutation = trpc.auth.login.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerForCheckoutMutation = trpc.auth.registerForCheckout.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const createSubscriptionMutation = trpc.auth.createSubscription.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const requestEmailVerificationMutation = trpc.auth.requestEmailVerification.useMutation({
    onSuccess: () => {
      toast.success("Se o email existir e estiver pendente, enviaremos um novo link.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Preencha email e senha");
      return;
    }
    try {
      await loginMutation.mutateAsync(loginForm);
      await utils.auth.me.invalidate();

      if (selectedCheckoutPlan) {
        const checkout = await createSubscriptionMutation.mutateAsync({
          plan: selectedCheckoutPlan,
          billingType: "PIX",
        });

        toast.success("Login concluido. Redirecionando para o pagamento.");
        window.location.assign(checkout.checkoutUrl);
        return;
      }

      navigate(getStartPageRoute());
    } catch {
      // Errors are handled by mutation callbacks.
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappDigits = onlyDigits(registerForm.whatsappLocal);
    const fullWhatsapp = `+55${whatsappDigits}`;

    if (
      !registerForm.firstName ||
      !registerForm.lastName ||
      !registerForm.email ||
      !whatsappDigits ||
      !registerForm.taxId ||
      !registerForm.password ||
      !registerForm.passwordConfirm
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (registerForm.password !== registerForm.passwordConfirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (whatsappDigits.length < 8 || whatsappDigits.length > 15) {
      toast.error("Informe um número de WhatsApp válido.");
      return;
    }

    const passwordError = getPasswordPolicyError(registerForm.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (!isValidTaxId(registerForm.taxId)) {
      toast.error("CPF/CNPJ inválido. Verifique os dígitos informados.");
      return;
    }

    const payload = {
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      email: registerForm.email.trim().toLowerCase(),
      whatsapp: fullWhatsapp,
      taxId: registerForm.taxId.trim(),
      password: registerForm.password,
    };

    try {
      if (selectedCheckoutPlan) {
        const result = await registerForCheckoutMutation.mutateAsync({
          ...payload,
          plan: selectedCheckoutPlan,
        });
        storePendingCheckoutContext({
          token: result.checkoutCompletionToken,
          email: payload.email,
          firstName: payload.firstName,
          plan: selectedCheckoutPlan,
        });
        toast.success("Conta criada. Redirecionando para o pagamento.");
        window.location.assign(result.checkoutUrl);
        return;
      }

      await registerMutation.mutateAsync(payload);
      await utils.auth.me.invalidate();
      toast.success("Conta criada. Enviamos um email de verificação.");
      navigate(getStartPageRoute());
    } catch {
      // Errors are handled by mutation callbacks.
    }
  };

  const handleRequestEmailVerification = () => {
    const normalizedEmail = loginForm.email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Informe seu email para reenviar o link de verificação.");
      return;
    }

    requestEmailVerificationMutation.mutate({
      email: normalizedEmail,
    });
  };

  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    registerForCheckoutMutation.isPending ||
    createSubscriptionMutation.isPending ||
    requestEmailVerificationMutation.isPending;
  const checkoutPlanCard = getPlanCard(selectedCheckoutPlan);

  useEffect(() => {
    const nextTab = readTabFromSearch();
    const nextPlan = readCheckoutPlanFromSearch();
    if (nextTab) {
      setTab(nextTab);
    } else if (nextPlan) {
      setTab("register");
    }
    setSelectedCheckoutPlan(nextPlan);
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google_login");
    if (!status) return;

    if (status === "config_missing") {
      toast.error("Login Google não está configurado no servidor.");
    } else if (status === "state_error") {
      toast.error("Falha de segurança no login Google. Tente novamente.");
    } else if (status === "missing_code") {
      toast.error("Google não retornou código de autorização.");
    } else if (status === "email_conflict") {
      toast.error("Este email já está vinculado a outra conta Google.");
    } else if (status === "user_error") {
      toast.error("Não foi possível finalizar seu login Google.");
    } else if (status === "error") {
      toast.error("Falha ao entrar com Google.");
    }

    params.delete("google_login");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,_oklch(0.9_0.08_252_/_0.38),transparent_38%),radial-gradient(circle_at_85%_90%,_oklch(0.9_0.06_185_/_0.32),transparent_40%)]" />
      <div className="relative w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk']">Orbita</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {checkoutPlanCard
              ? `Você está contratando ${checkoutPlanCard.label} e será redirecionado ao pagamento após concluir este passo.`
              : "Entrar na sua central de operação"}
          </p>
        </div>

        <div className="surface-card rounded-2xl p-6">
          {checkoutPlanCard ? (
            <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/8 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Plano selecionado
                  </p>
                  <h2 className="mt-2 text-xl font-bold font-['Space_Grotesk']">
                    {checkoutPlanCard.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checkoutPlanCard.monthlyPrice} • {checkoutPlanCard.audience}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  Trocar plano
                </Button>
              </div>
            </div>
          ) : null}

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

          {!checkoutPlanCard ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={() => {
                  window.location.href = "/api/oauth/google/login";
                }}
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Entrar com Google
              </Button>
              <p className="text-[11px] text-center text-muted-foreground mb-4">
                ou continue com email e senha
              </p>
            </>
          ) : (
            <p className="text-[11px] text-center text-muted-foreground mb-4">
              {tab === "login"
                ? "Entre na sua conta para seguir direto ao checkout deste plano."
                : "Crie sua conta com os dados mínimos e complete o restante depois do pagamento."}
            </p>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  name="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <div className="text-right pt-1">
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Esqueci minha senha
                    </Link>
                    <Link
                      href="/forgot-email"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Esqueci meu email
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleRequestEmailVerification}
                      disabled={requestEmailVerificationMutation.isPending}
                    >
                      Reenviar verificação de email
                    </button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : checkoutPlanCard ? (
                  "Entrar e ir para pagamento"
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first-name">Nome</Label>
                  <Input
                    id="reg-first-name"
                    name="reg-first-name"
                    type="text"
                    placeholder="Seu nome"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, firstName: e.target.value }))}
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-last-name">Sobrenome</Label>
                  <Input
                    id="reg-last-name"
                    name="reg-last-name"
                    type="text"
                    placeholder="Seu sobrenome"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, lastName: e.target.value }))}
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    name="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="reg-whatsapp">WhatsApp</Label>
                  <Input
                    id="reg-whatsapp"
                    name="reg-whatsapp"
                    type="tel"
                    placeholder="Somente número (sem +55)"
                    value={registerForm.whatsappLocal}
                    onChange={(e) =>
                      setRegisterForm((f) => ({
                        ...f,
                        whatsappLocal: onlyDigits(e.target.value).slice(0, 15),
                      }))
                    }
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-muted-foreground">
                    DDI aplicado automaticamente: <strong>+55</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-tax-id">CPF ou CNPJ</Label>
                  <Input
                    id="reg-tax-id"
                    name="reg-tax-id"
                    type="text"
                    placeholder="Somente números ou formatado"
                    value={registerForm.taxId}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, taxId: e.target.value }))}
                    onBlur={(e) =>
                      setRegisterForm((f) => ({
                        ...f,
                        taxId: formatTaxId(e.target.value),
                      }))
                    }
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input
                    id="reg-password"
                    name="reg-password"
                    type="password"
                    placeholder="Senha forte"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use 8+ caracteres, sem espaços, com maiúscula, minúscula, número e especial.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password-confirm">Confirmar senha</Label>
                  <Input
                    id="reg-password-confirm"
                    name="reg-password-confirm"
                    type="password"
                    placeholder="Repita sua senha"
                    value={registerForm.passwordConfirm}
                    onChange={(e) =>
                      setRegisterForm((f) => ({ ...f, passwordConfirm: e.target.value }))
                    }
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="sm:col-span-2 rounded-md border border-border/80 p-3 text-xs text-muted-foreground">
                  Depois do pagamento, vamos pedir só os dados complementares: endereço, cidade,
                  origem do lead, idioma e preferências.
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : checkoutPlanCard ? (
                  "Criar conta e ir para pagamento"
                ) : (
                  "Criar conta"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {checkoutPlanCard
                  ? "Sua conta será criada, o checkout abrirá com seus dados preenchidos e o restante será concluído depois do pagamento."
                  : "O primeiro usuário criado recebe permissão de admin."}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
