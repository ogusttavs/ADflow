import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  ACQUISITION_SOURCE_OPTIONS,
  onlyDigits,
  resolveBrazilZipCode,
} from "@/lib/profileCompletion";
import {
  clearPendingCheckoutContext,
  readPendingCheckoutContext,
} from "@/lib/checkoutContext";
import { getStartPageRoute } from "@/lib/user-settings";
import { getPlanCard } from "@/lib/planCatalog";
import { ORBITA_PLAN_VALUES, type OrbitaPlan } from "@shared/planAccess";
import {
  ArrowRight,
  CircleDashed,
  Clock3,
  CreditCard,
  LifeBuoy,
  Loader2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type ProfileFormState = {
  zipCode: string;
  city: string;
  addressBase: string;
  addressComplement: string;
  acquisitionSource: string;
  acquisitionSourceOther: string;
  preferredLanguage: string;
  marketingOptIn: boolean;
};

type CheckoutContextView = {
  firstName: string;
  email: string;
  whatsapp: string;
  city: string;
  address: string;
  acquisitionSource: string;
  preferredLanguage: string;
  marketingOptIn: boolean;
  plan: OrbitaPlan | null;
  planStatus: string | null;
  canAccessPlatform: boolean;
  profileCompleted: boolean;
};

const DEFAULT_FORM: ProfileFormState = {
  zipCode: "",
  city: "",
  addressBase: "",
  addressComplement: "",
  acquisitionSource: "",
  acquisitionSourceOther: "",
  preferredLanguage: "Português (Brasil)",
  marketingOptIn: true,
};

const DEFAULT_PREVIEW_PLAN: OrbitaPlan = "business_standard";

function readSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function readPreviewModeFlag() {
  return readSearchParams().get("preview") === "1";
}

function readPreviewPlanFromSearch(): OrbitaPlan | null {
  const value = readSearchParams().get("plan");
  if (!value) return null;
  if ((ORBITA_PLAN_VALUES as readonly string[]).includes(value)) {
    return value as OrbitaPlan;
  }
  return null;
}

function formatZipCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function buildPreviewContext(plan: OrbitaPlan): CheckoutContextView {
  return {
    firstName: "Gustavo",
    email: "gustavo@preview.orbita.app",
    whatsapp: "+55 11 98888-7777",
    city: "Sao Paulo",
    address: "Avenida Paulista, Bela Vista, Sao Paulo - SP, CEP 01311-000",
    acquisitionSource: "Instagram",
    preferredLanguage: "Português (Brasil)",
    marketingOptIn: true,
    plan,
    planStatus: "active",
    canAccessPlatform: true,
    profileCompleted: false,
  };
}

export default function ThankYou() {
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { user, loading: authLoading } = useAuth();
  const [pendingCheckout] = useState(() => readPendingCheckoutContext());
  const [profileForm, setProfileForm] = useState<ProfileFormState>(DEFAULT_FORM);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isResolvingZip, setIsResolvingZip] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(() => readPreviewModeFlag());
  const [previewPlan, setPreviewPlan] = useState<OrbitaPlan>(
    () => readPreviewPlanFromSearch() ?? pendingCheckout?.plan ?? DEFAULT_PREVIEW_PLAN,
  );

  useEffect(() => {
    setIsPreviewMode(readPreviewModeFlag());
    setPreviewPlan(readPreviewPlanFromSearch() ?? pendingCheckout?.plan ?? DEFAULT_PREVIEW_PLAN);
  }, [location, pendingCheckout?.plan]);

  const previewContext = useMemo(
    () => (isPreviewMode ? buildPreviewContext(previewPlan) : null),
    [isPreviewMode, previewPlan],
  );

  const checkoutContextQuery = trpc.auth.getCheckoutCompletionContext.useQuery(
    { token: pendingCheckout?.token ?? "" },
    {
      enabled: !user && Boolean(pendingCheckout?.token) && !isPreviewMode,
      retry: false,
      refetchInterval: (query) =>
        query.state.data?.canAccessPlatform ? false : 4000,
    },
  );

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const completeCheckoutProfileMutation = trpc.auth.completeCheckoutProfile.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const activateCheckoutAccessMutation = trpc.auth.activateCheckoutAccess.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sourceData = useMemo<CheckoutContextView | null>(() => {
    if (user) {
      return {
        firstName: user.firstName ?? "",
        email: user.email ?? "",
        whatsapp: user.whatsapp ?? "",
        city: user.city ?? "",
        address: user.address ?? "",
        acquisitionSource: user.acquisitionSource ?? "",
        preferredLanguage: user.preferredLanguage ?? "Português (Brasil)",
        marketingOptIn: Boolean(user.marketingOptIn),
        plan: user.plan ?? null,
        planStatus: user.planStatus ?? null,
        canAccessPlatform: user.planStatus === "active" || user.planStatus === "trial",
        profileCompleted: Boolean(
          user.city?.trim() &&
            user.address?.trim() &&
            user.acquisitionSource?.trim() &&
            user.preferredLanguage?.trim(),
        ),
      };
    }

    if (checkoutContextQuery.data) {
      return checkoutContextQuery.data;
    }

    return previewContext;
  }, [checkoutContextQuery.data, previewContext, user]);

  const checkoutPlanCard = getPlanCard(sourceData?.plan ?? pendingCheckout?.plan ?? previewPlan);

  useEffect(() => {
    if (!sourceData) return;

    setProfileForm((current) => {
      if (
        current.city ||
        current.addressBase ||
        current.acquisitionSource ||
        current.addressComplement ||
        current.zipCode
      ) {
        return current;
      }

      return {
        ...current,
        city: sourceData.city ?? "",
        addressBase: sourceData.address ?? "",
        acquisitionSource: sourceData.acquisitionSource ?? "",
        preferredLanguage: sourceData.preferredLanguage ?? "Português (Brasil)",
        marketingOptIn: sourceData.marketingOptIn ?? current.marketingOptIn,
      };
    });
    setProfileSaved(Boolean(sourceData.profileCompleted));
  }, [sourceData]);

  const isBusy =
    authLoading ||
    checkoutContextQuery.isLoading ||
    updateProfileMutation.isPending ||
    completeCheckoutProfileMutation.isPending ||
    activateCheckoutAccessMutation.isPending;

  const canAttemptActivation = Boolean(
    !isPreviewMode &&
      !user &&
      pendingCheckout?.token &&
      profileSaved &&
      sourceData?.canAccessPlatform &&
      !activateCheckoutAccessMutation.isPending,
  );

  useEffect(() => {
    if (!canAttemptActivation) return;

    void activateCheckoutAccessMutation
      .mutateAsync({ token: pendingCheckout!.token })
      .then(async (result) => {
        if (!result.success) return;
        clearPendingCheckoutContext();
        await utils.auth.me.invalidate();
        navigate(getStartPageRoute());
      })
      .catch(() => {
        // Toast handled in mutation.
      });
  }, [activateCheckoutAccessMutation, canAttemptActivation, navigate, pendingCheckout, utils.auth.me]);

  const handleZipCodeBlur = async () => {
    const zipDigits = onlyDigits(profileForm.zipCode);
    if (zipDigits.length !== 8) return;

    setIsResolvingZip(true);
    try {
      const result = await resolveBrazilZipCode(zipDigits);
      if (!result) {
        toast.error("CEP nao encontrado. Confira e tente novamente.");
        return;
      }

      setProfileForm((current) => ({
        ...current,
        city: result.city || current.city,
        addressBase: result.addressBase || current.addressBase,
      }));
    } catch (error) {
      console.error("[ThankYou] Failed to resolve ZIP code", error);
      toast.error("Nao foi possivel buscar o CEP agora. Tente novamente.");
    } finally {
      setIsResolvingZip(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    const resolvedAcquisitionSource =
      profileForm.acquisitionSource === "Outro"
        ? profileForm.acquisitionSourceOther.trim()
        : profileForm.acquisitionSource.trim();
    const finalAddress = [profileForm.addressBase.trim(), profileForm.addressComplement.trim()]
      .filter(Boolean)
      .join(", ");
    const safeCity = profileForm.city.trim();
    const safeLanguage = profileForm.preferredLanguage.trim() || "Português (Brasil)";

    if (!safeCity || !finalAddress || !resolvedAcquisitionSource || !safeLanguage) {
      toast.error("Preencha cidade, endereco, origem e idioma para continuar.");
      return;
    }

    if (isPreviewMode) {
      setProfileSaved(true);
      toast.success("Previa salva. No fluxo real, estes dados sao enviados apos a compra.");
      return;
    }

    try {
      if (user) {
        await updateProfileMutation.mutateAsync({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          whatsapp: user.whatsapp ?? "",
          city: safeCity,
          address: finalAddress,
          acquisitionSource: resolvedAcquisitionSource,
          preferredLanguage: safeLanguage,
          marketingOptIn: profileForm.marketingOptIn,
        });
        await utils.auth.me.invalidate();

        toast.success("Perfil complementar salvo.");
        setProfileSaved(true);

        if (sourceData?.canAccessPlatform) {
          navigate(getStartPageRoute());
        }
        return;
      }

      if (!pendingCheckout?.token) {
        toast.error("Nao encontramos a sessao do seu checkout. Faca login para continuar.");
        return;
      }

      const result = await completeCheckoutProfileMutation.mutateAsync({
        token: pendingCheckout.token,
        profile: {
          city: safeCity,
          address: finalAddress,
          acquisitionSource: resolvedAcquisitionSource,
          preferredLanguage: safeLanguage,
          marketingOptIn: profileForm.marketingOptIn,
        },
      });

      setProfileSaved(result.profileCompleted);
      toast.success(
        result.canAccessPlatform
          ? "Perfil salvo. Liberando seu acesso..."
          : "Perfil salvo. Agora estamos aguardando a confirmacao do pagamento.",
      );
      void checkoutContextQuery.refetch();
    } catch {
      // Toast handled in mutation callbacks.
    }
  };

  const accessReady = Boolean(sourceData?.canAccessPlatform && profileSaved);
  const paymentLabel = isPreviewMode
    ? "Exemplo aprovado"
    : sourceData?.canAccessPlatform
      ? "Confirmado"
      : "Aguardando confirmacao";
  const profileLabel = profileSaved ? "Concluido" : "Pendente";
  const accessLabel = accessReady ? "Liberado" : "Bloqueado ate concluir";
  const currentEmail = sourceData?.email ?? pendingCheckout?.email ?? previewContext?.email ?? "";
  const currentWhatsapp = sourceData?.whatsapp ?? previewContext?.whatsapp ?? "";
  const welcomeName = sourceData?.firstName ?? pendingCheckout?.firstName ?? previewContext?.firstName;

  const activationSteps = [
    {
      title: "Conta e checkout iniciados",
      description: "O usuario escolheu o plano, criou a conta e seguiu para o checkout da Kiwify.",
      done: Boolean(currentEmail),
    },
    {
      title: "Perfil complementar salvo",
      description: "Endereco, origem e idioma ficam registrados para personalizar a plataforma.",
      done: profileSaved,
    },
    {
      title: "Pagamento validado e acesso liberado",
      description: "O webhook marca o plano como ativo e o acesso e liberado automaticamente.",
      done: accessReady || Boolean(sourceData?.canAccessPlatform),
    },
  ];

  const statusCards = [
    {
      title: "Pagamento",
      value: paymentLabel,
      tone: sourceData?.canAccessPlatform || isPreviewMode
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
        : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
      icon: CreditCard,
    },
    {
      title: "Perfil",
      value: profileLabel,
      tone: profileSaved
        ? "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100"
        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-900 dark:text-zinc-100",
      icon: MapPinned,
    },
    {
      title: "Acesso",
      value: accessLabel,
      tone: accessReady
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-900 dark:text-zinc-100",
      icon: ShieldCheck,
    },
  ];

  if (!user && !pendingCheckout?.token && !authLoading && !isPreviewMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_oklch(0.93_0.05_80_/_0.55),transparent_32%),radial-gradient(circle_at_bottom_right,_oklch(0.91_0.07_220_/_0.38),transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-border/70 bg-card/95 p-8 text-center shadow-[0_25px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold">Pagamento em processamento</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Nao encontramos o contexto do seu checkout neste navegador. Se voce ja pagou, volte
              usando o mesmo navegador ou faca login com a conta criada antes do pagamento.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              A pagina externa da Kiwify depende da aprovacao do pagamento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/login")}>Ir para login</Button>
              <Button variant="outline" asChild>
                <Link href="/obrigado?preview=1">Abrir pre-visualizacao</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Voltar para a home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_oklch(0.94_0.05_80_/_0.55),transparent_28%),radial-gradient(circle_at_85%_20%,_oklch(0.91_0.07_220_/_0.32),transparent_30%),linear-gradient(180deg,transparent_0%,oklch(0.98_0.01_95_/_0.68)_100%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-xl font-bold">Orbita</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Ativacao pos-checkout
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {isPreviewMode ? (
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 dark:text-amber-200">
                Preview ativo
              </span>
            ) : null}
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Fluxo Kiwify + Orbita
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-border/60 bg-card/80 p-7 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Etapa final antes do acesso
            </div>
            <h1 className="mt-5 font-['Space_Grotesk'] text-4xl font-bold leading-tight sm:text-5xl">
              {welcomeName ? `${welcomeName}, falta pouco para entrar.` : "Falta pouco para entrar."}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Finalize os dados que a Orbita precisa para organizar sua operacao desde o primeiro
              acesso. Assim que o pagamento ficar ativo, a liberacao acontece automaticamente.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {statusCards.map(({ title, value, tone, icon: Icon }) => (
                <div
                  key={title}
                  className={cn(
                    "rounded-2xl border p-4 shadow-sm shadow-black/5",
                    tone,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">{title}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 font-['Space_Grotesk'] text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f172a_0%,#12243b_52%,#164e63_100%)] p-7 text-slate-50 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.95)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">
                  Plano contratado
                </p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold">
                  {checkoutPlanCard?.label ?? "Plano selecionado"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {checkoutPlanCard?.audience ?? "Plano em processo de ativacao no checkout."}
                </p>
              </div>
              <Clock3 className="mt-1 h-6 w-6 text-cyan-200" />
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-200">Resumo comercial</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="font-['Space_Grotesk'] text-4xl font-bold">
                    {checkoutPlanCard?.monthlyPrice ?? "Sob consulta"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Checkout hospedado pela Kiwify com ativacao automatica por webhook.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm text-slate-200">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>O acesso nao abre antes do pagamento ativo e do perfil complementar salvo.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                <MapPinned className="mt-0.5 h-4 w-4 text-cyan-200" />
                <span>O CEP preenche cidade e endereco base para reduzir friccao nesta etapa.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                <ArrowRight className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>Se a Kiwify nao voltar para esta pagina automaticamente, o login continua como fallback seguro.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-border/60 bg-card/90 p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Ativacao em 3 passos
              </p>
              <div className="mt-5 space-y-4">
                {activationSteps.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold",
                        step.done
                          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                          : "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
                      )}
                    >
                      {step.done ? <ShieldCheck className="h-4 w-4" /> : `0${index + 1}`}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-card/90 p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
              <div className="flex items-center gap-3">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">Se algo travar</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>1. Verifique se o pagamento ja foi aprovado na Kiwify.</li>
                <li>2. Clique em "Verificar pagamento novamente" para forcar a leitura do status.</li>
                <li>3. Se voltou sem contexto, faca login com a conta criada antes do checkout.</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-card/90 p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
              <div className="flex items-center gap-3">
                <CircleDashed className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">Observacao operacional</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                A pagina externa da Kiwify depende da aprovacao do pagamento. Em Pix gerado ou boleto
                gerado, o retorno automatico pode nao acontecer. O webhook continua sendo a fonte de
                verdade para ativar a assinatura.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-border/60 bg-card/95 p-6 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.85)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Completar cadastro
                </p>
                <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold">Dados finais da conta</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O objetivo aqui e reduzir retrabalho no checkout e abrir a plataforma ja pronta para uso.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-primary">
                {accessReady ? "Tudo pronto para entrar" : "Preencha e aguarde a liberacao"}
              </div>
            </div>

            {isPreviewMode ? (
              <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
                Esta pagina esta em modo de pre-visualizacao. O visual e os campos sao reais, mas nenhum dado sera enviado.
              </div>
            ) : null}

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
              <section className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground">Conta principal</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estes dados vieram do cadastro feito antes do pagamento.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="thankyou-email">Email da conta</Label>
                    <Input id="thankyou-email" value={currentEmail} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="thankyou-whatsapp">WhatsApp cadastrado</Label>
                    <Input id="thankyou-whatsapp" value={currentWhatsapp} disabled />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground">Endereco e localizacao</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O CEP preenche automaticamente cidade e endereco base quando possivel.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="thankyou-zip">CEP</Label>
                    <Input
                      id="thankyou-zip"
                      placeholder="00000-000"
                      value={formatZipCode(profileForm.zipCode)}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          zipCode: onlyDigits(event.target.value).slice(0, 8),
                        }))
                      }
                      onBlur={handleZipCodeBlur}
                      disabled={isBusy || isResolvingZip}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isResolvingZip
                        ? "Buscando endereco..."
                        : "Ao sair do campo, buscamos o endereco automaticamente."}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="thankyou-city">Cidade</Label>
                    <Input
                      id="thankyou-city"
                      placeholder="Cidade onde mora"
                      value={profileForm.city}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, city: event.target.value }))
                      }
                      disabled={isBusy}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="thankyou-address-base">Endereco</Label>
                    <Textarea
                      id="thankyou-address-base"
                      rows={3}
                      placeholder="Rua, bairro e demais dados base"
                      value={profileForm.addressBase}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          addressBase: event.target.value,
                        }))
                      }
                      disabled={isBusy}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="thankyou-address-complement">Complemento</Label>
                    <Input
                      id="thankyou-address-complement"
                      placeholder="Numero, apto, bloco, referencia..."
                      value={profileForm.addressComplement}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          addressComplement: event.target.value,
                        }))
                      }
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground">Origem e preferencia</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Isso ajuda a Orbita a entender de onde os clientes estao vindo e qual idioma usar.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="thankyou-source">Onde conheceu a Orbita?</Label>
                    <Select
                      value={profileForm.acquisitionSource}
                      onValueChange={(value) =>
                        setProfileForm((current) => ({
                          ...current,
                          acquisitionSource: value,
                          acquisitionSourceOther:
                            value === "Outro" ? current.acquisitionSourceOther : "",
                        }))
                      }
                      disabled={isBusy}
                    >
                      <SelectTrigger id="thankyou-source">
                        <SelectValue placeholder="Selecione uma opcao" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACQUISITION_SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {profileForm.acquisitionSource === "Outro" ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="thankyou-source-other">Detalhe a origem</Label>
                      <Input
                        id="thankyou-source-other"
                        placeholder="Conte pra gente onde encontrou a Orbita"
                        value={profileForm.acquisitionSourceOther}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            acquisitionSourceOther: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="thankyou-language">Idioma da interface</Label>
                    <Input
                      id="thankyou-language"
                      placeholder="Português (Brasil)"
                      value={profileForm.preferredLanguage}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          preferredLanguage: event.target.value,
                        }))
                      }
                      disabled={isBusy}
                    />
                  </div>
                  <label className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                    <Checkbox
                      checked={profileForm.marketingOptIn}
                      onCheckedChange={(checked) =>
                        setProfileForm((current) => ({
                          ...current,
                          marketingOptIn: checked === true,
                        }))
                      }
                      disabled={isBusy}
                    />
                    <span className="text-sm leading-6 text-muted-foreground">
                      Quero receber emails da Orbita com novidades, conteudos e avisos importantes.
                    </span>
                  </label>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={isBusy || isResolvingZip}>
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPreviewMode ? (
                    "Simular envio do perfil"
                  ) : sourceData?.canAccessPlatform ? (
                    "Salvar e entrar na plataforma"
                  ) : (
                    "Salvar dados e aguardar liberacao"
                  )}
                </Button>
                {!user && pendingCheckout?.token && !isPreviewMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => void checkoutContextQuery.refetch()}
                  >
                    Verificar pagamento novamente
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" asChild>
                  <Link href="/">Voltar para a home</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
