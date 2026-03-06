import AppLayout from "@/components/AppLayout";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserRound,
  Bell,
  Target,
  Palette,
  Save,
  Loader2,
  ShieldCheck,
  MoonStar,
  Sun,
  Settings as SettingsIcon,
  BadgeDollarSign,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  USER_SETTINGS_KEYS,
  START_PAGE_OPTIONS,
  clampNumber,
  getSettingBoolean,
  getSettingNumber,
  getSettingString,
  normalizeStartPageRoute,
  setSetting,
} from "@/lib/user-settings";
import { PLAN_CARDS } from "@/lib/planCatalog";
import { getPasswordPolicyError } from "@shared/passwordPolicy";
import { isValidTaxId } from "@shared/taxId";

const THEME_OPTIONS: Array<{
  id: Theme;
  label: string;
  subtitle: string;
  shell: string;
  header: string;
  lineA: string;
  lineB: string;
}> = [
  {
    id: "light",
    label: "Claro",
    subtitle: "Neutro e clean",
    shell: "bg-slate-50 border-slate-200 text-slate-900",
    header: "bg-blue-500/85",
    lineA: "bg-slate-300",
    lineB: "bg-slate-200",
  },
  {
    id: "dark",
    label: "Escuro",
    subtitle: "Padrão dark",
    shell: "bg-slate-900 border-slate-700 text-slate-100",
    header: "bg-indigo-400/80",
    lineA: "bg-slate-700",
    lineB: "bg-slate-800",
  },
  {
    id: "dark-blue",
    label: "Dark Blue",
    subtitle: "Azul profundo",
    shell: "bg-[#0c1a3f] border-[#253e80] text-[#dbe7ff]",
    header: "bg-[#7ca2ff]",
    lineA: "bg-[#2e4f9b]",
    lineB: "bg-[#1f3672]",
  },
  {
    id: "all-black",
    label: "All Black",
    subtitle: "Contraste máximo",
    shell: "bg-black border-zinc-800 text-zinc-100",
    header: "bg-zinc-100/90",
    lineA: "bg-zinc-700",
    lineB: "bg-zinc-800",
  },
  {
    id: "iron-man",
    label: "Iron Man",
    subtitle: "Vermelho e dourado",
    shell: "bg-[#1d0d0b] border-[#74251b] text-[#ffd8a0]",
    header: "bg-[#ffbf3e]",
    lineA: "bg-[#b73726]",
    lineB: "bg-[#7a2419]",
  },
];

const SETTINGS_TABS = [
  "general",
  "security",
  "notifications",
  "productivity",
  "appearance",
  "plans",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

function normalizeSettingsTab(value: string | null): SettingsTab {
  if (!value) return "general";
  if (SETTINGS_TABS.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return "general";
}

function getSettingsTabFromSearch(search: string): SettingsTab {
  const params = new URLSearchParams(search);
  return normalizeSettingsTab(params.get("tab"));
}

function getCheckoutErrorMessage(rawMessage: string) {
  const normalized = rawMessage.trim().toLowerCase();
  if (!normalized) return "Nao foi possivel iniciar o checkout. Tente novamente.";
  if (normalized.includes("fetch failed")) {
    return "Nao foi possivel conectar ao gateway de pagamento. Tente novamente em instantes.";
  }
  return rawMessage;
}

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { theme, setTheme, toggleTheme, switchable } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window === "undefined") return "general";
    return getSettingsTabFromSearch(window.location.search);
  });
  const userLoginMethod = (user?.loginMethod ?? "").toLowerCase();
  const canChangePassword = userLoginMethod.includes("email");
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
    city: "",
    address: "",
    acquisitionSource: "",
    preferredLanguage: "Português (Brasil)",
    taxId: "",
    marketingOptIn: false,
  });
  const [startPage, setStartPage] = useState(() =>
    normalizeStartPageRoute(getSettingString(USER_SETTINGS_KEYS.startPage, "/dashboard"))
  );

  const [notifTaskReminders, setNotifTaskReminders] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.notifTaskReminders, true)
  );
  const [notifDailyBriefing, setNotifDailyBriefing] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.notifDailyBriefing, true)
  );
  const [notifFinanceAlerts, setNotifFinanceAlerts] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.notifFinanceAlerts, true)
  );
  const [notifCrmAlerts, setNotifCrmAlerts] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.notifCrmAlerts, true)
  );

  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.weekStartsOnMonday, true)
  );
  const [showDailyBriefingOnLogin, setShowDailyBriefingOnLogin] = useState(() =>
    getSettingBoolean(USER_SETTINGS_KEYS.showDailyBriefingOnLogin, true)
  );
  const [taskGoal, setTaskGoal] = useState(() =>
    String(clampNumber(getSettingNumber(USER_SETTINGS_KEYS.dailyTaskGoal, 5), 1, 50, 5))
  );
  const [prospectingGoal, setProspectingGoal] = useState(() =>
    String(clampNumber(getSettingNumber(USER_SETTINGS_KEYS.dailyLeadProspectGoal, 10), 1, 50, 10))
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { data: subscriptionStatus } = trpc.auth.getSubscriptionStatus.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createSubscriptionMutation = trpc.auth.createSubscription.useMutation({
    onSuccess: (result) => {
      void utils.auth.me.invalidate();
      void utils.auth.getSubscriptionStatus.invalidate();
      if (result.checkoutUrl) {
        toast.success("Plano atualizado. Redirecionando para checkout...");
        window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
        return;
      }
      toast.success("Plano atualizado. O link de pagamento esta sendo preparado, tente novamente em alguns segundos.");
    },
    onError: (error) => {
      toast.error(getCheckoutErrorMessage(error.message));
    },
  });

  const resendVerificationMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: (result) => {
      if (result.alreadyVerified) {
        toast.success("Seu email já está verificado.");
      } else {
        toast.success("Enviamos um novo link de verificação para seu email.");
      }
      void utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: (result) => {
      setIsEditingAccount(false);
      setAccountForm((prev) => ({ ...prev, taxId: "" }));
      void utils.auth.me.invalidate();

      if (result.emailVerificationRequired) {
        toast.success("Dados salvos. Confirmamos um novo email de verificação para o endereço atualizado.");
        return;
      }
      toast.success("Dados da conta atualizados com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Senha alterada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const requestPasswordResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Se o email existir, enviaremos um link de recuperação.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!user || isEditingAccount) return;
    setAccountForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      whatsapp: user.whatsapp ?? "",
      city: user.city ?? "",
      address: user.address ?? "",
      acquisitionSource: user.acquisitionSource ?? "",
      preferredLanguage:
        user.preferredLanguage ??
        getSettingString(USER_SETTINGS_KEYS.interfaceLanguage, "Português (Brasil)"),
      taxId: "",
      marketingOptIn: Boolean(user.marketingOptIn),
    });
  }, [
    isEditingAccount,
    user?.acquisitionSource,
    user?.address,
    user?.city,
    user?.email,
    user?.firstName,
    user?.lastName,
    user?.marketingOptIn,
    user?.preferredLanguage,
    user?.whatsapp,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncActiveTabFromUrl = () => {
      setActiveTab(getSettingsTabFromSearch(window.location.search));
    };

    syncActiveTabFromUrl();
    window.addEventListener("popstate", syncActiveTabFromUrl);
    return () => {
      window.removeEventListener("popstate", syncActiveTabFromUrl);
    };
  }, []);

  const handleTabChange = (tabValue: string) => {
    const nextTab = normalizeSettingsTab(tabValue);
    setActiveTab(nextTab);
    if (typeof window === "undefined") {
      return;
    }
    const nextUrl = nextTab === "general" ? "/settings" : `/settings?tab=${nextTab}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  };

  const currentPlan = subscriptionStatus?.plan ?? user?.plan ?? null;
  const currentPlanStatus = subscriptionStatus?.planStatus ?? user?.planStatus ?? null;
  const currentPlanExpiry = subscriptionStatus?.planExpiry ?? user?.planExpiry ?? null;

  const handleCancelAccountEdit = () => {
    if (!user) return;
    setIsEditingAccount(false);
    setAccountForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      whatsapp: user.whatsapp ?? "",
      city: user.city ?? "",
      address: user.address ?? "",
      acquisitionSource: user.acquisitionSource ?? "",
      preferredLanguage:
        user.preferredLanguage ??
        getSettingString(USER_SETTINGS_KEYS.interfaceLanguage, "Português (Brasil)"),
      taxId: "",
      marketingOptIn: Boolean(user.marketingOptIn),
    });
  };

  const handleSaveGeneral = () => {
    if (!isEditingAccount) return;

    const safeFirstName = accountForm.firstName.trim();
    const safeLastName = accountForm.lastName.trim();
    const safeEmail = accountForm.email.trim();
    const safeWhatsapp = accountForm.whatsapp.trim();
    const safeCity = accountForm.city.trim();
    const safeAddress = accountForm.address.trim();
    const safeAcquisitionSource = accountForm.acquisitionSource.trim();
    const safeLanguage = accountForm.preferredLanguage.trim() || "Português (Brasil)";
    const safeStartPage = normalizeStartPageRoute(startPage);
    const safeTaxId = accountForm.taxId.trim();

    if (
      !safeFirstName ||
      !safeLastName ||
      !safeEmail ||
      !safeWhatsapp ||
      !safeCity ||
      !safeAddress ||
      !safeAcquisitionSource
    ) {
      toast.error("Preencha todos os campos obrigatórios da conta.");
      return;
    }
    if (!safeTaxId && !user?.taxIdMasked) {
      toast.error("Informe CPF/CNPJ para concluir o cadastro da conta.");
      return;
    }

    if (safeTaxId) {
      if (!isValidTaxId(safeTaxId)) {
        toast.error("CPF/CNPJ inválido. Verifique os dígitos informados.");
        return;
      }
    }

    setStartPage(safeStartPage);
    setSetting(USER_SETTINGS_KEYS.interfaceLanguage, safeLanguage);
    setSetting(USER_SETTINGS_KEYS.startPage, safeStartPage);
    updateProfileMutation.mutate({
      firstName: safeFirstName,
      lastName: safeLastName,
      email: safeEmail,
      whatsapp: safeWhatsapp,
      city: safeCity,
      address: safeAddress,
      acquisitionSource: safeAcquisitionSource,
      preferredLanguage: safeLanguage,
      marketingOptIn: accountForm.marketingOptIn,
      taxId: safeTaxId || undefined,
    });
  };

  const handleSaveNotifications = () => {
    setSetting(USER_SETTINGS_KEYS.notifTaskReminders, notifTaskReminders);
    setSetting(USER_SETTINGS_KEYS.notifDailyBriefing, notifDailyBriefing);
    setSetting(USER_SETTINGS_KEYS.notifFinanceAlerts, notifFinanceAlerts);
    setSetting(USER_SETTINGS_KEYS.notifCrmAlerts, notifCrmAlerts);
    toast.success("Alertas salvos com sucesso!");
  };

  const handleSaveProductivity = () => {
    const normalizedTaskGoal = clampNumber(Number(taskGoal), 1, 50, 5);
    const normalizedProspectingGoal = clampNumber(Number(prospectingGoal), 1, 50, 10);

    setTaskGoal(String(normalizedTaskGoal));
    setProspectingGoal(String(normalizedProspectingGoal));

    setSetting(USER_SETTINGS_KEYS.weekStartsOnMonday, weekStartsOnMonday);
    setSetting(USER_SETTINGS_KEYS.showDailyBriefingOnLogin, showDailyBriefingOnLogin);
    setSetting(USER_SETTINGS_KEYS.dailyTaskGoal, normalizedTaskGoal);
    setSetting(USER_SETTINGS_KEYS.dailyLeadAddGoal, normalizedTaskGoal);
    setSetting(USER_SETTINGS_KEYS.dailyLeadProspectGoal, normalizedProspectingGoal);

    toast.success("Preferências de rotina salvas com sucesso!");
  };

  const handleChangePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canChangePassword) {
      toast.error("Esta conta não usa senha local para login.");
      return;
    }
    if (!user?.emailVerified) {
      toast.error("Confirme seu email antes de alterar a senha.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Preencha os 3 campos de senha.");
      return;
    }
    const passwordError = getPasswordPolicyError(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("A nova senha deve ser diferente da senha atual.");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <AppLayout>
      <div className="page-content space-y-6">
        <div className="page-header">
          <div className="page-title-block">
            <p className="page-kicker">Conta</p>
            <h1 className="page-title">Configurações</h1>
            <p className="page-subtitle">Ajuste o Orbita para a sua rotina e o seu negócio</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto [&>button]:flex-none [&>button]:shrink-0">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <UserRound className="w-4 h-4" />Conta
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />Alertas
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <Target className="w-4 h-4" />Rotina
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />Aparência
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />Planos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Perfil da Conta
                    </CardTitle>
                    {user?.emailVerified ? (
                      <Badge className="text-[10px]">Email verificado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Email pendente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-first-name">Nome</Label>
                      <Input
                        id="settings-account-first-name"
                        name="settings-account-first-name"
                        value={accountForm.firstName}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-last-name">Sobrenome</Label>
                      <Input
                        id="settings-account-last-name"
                        name="settings-account-last-name"
                        value={accountForm.lastName}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="settings-account-main-email">E-mail principal</Label>
                      <Input
                        id="settings-account-main-email"
                        name="settings-account-main-email"
                        type="email"
                        value={accountForm.email}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-whatsapp">WhatsApp</Label>
                      <Input
                        id="settings-account-whatsapp"
                        name="settings-account-whatsapp"
                        value={accountForm.whatsapp}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-city">Cidade</Label>
                      <Input
                        id="settings-account-city"
                        name="settings-account-city"
                        value={accountForm.city}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, city: e.target.value }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="settings-account-address">Endereço</Label>
                      <Textarea
                        id="settings-account-address"
                        name="settings-account-address"
                        rows={2}
                        className="bg-input border-border resize-none"
                        value={accountForm.address}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-source">Onde conheceu a Orbita</Label>
                      <Input
                        id="settings-account-source"
                        name="settings-account-source"
                        value={accountForm.acquisitionSource}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            acquisitionSource: e.target.value,
                          }))
                        }
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-tax-id">CPF ou CNPJ</Label>
                      <Input
                        id="settings-account-tax-id"
                        name="settings-account-tax-id"
                        value={
                          isEditingAccount
                            ? accountForm.taxId
                            : user?.taxIdMasked ?? "Não informado"
                        }
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, taxId: e.target.value }))
                        }
                        placeholder={user?.taxIdMasked ?? "Informe CPF/CNPJ"}
                        className="bg-input border-border"
                        disabled={!isEditingAccount || updateProfileMutation.isPending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Preferências Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-general-language">Idioma da interface</Label>
                    <Input
                      id="settings-general-language"
                      name="settings-general-language"
                      value={accountForm.preferredLanguage}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          preferredLanguage: e.target.value,
                        }))
                      }
                      className="bg-input border-border"
                      disabled={!isEditingAccount || updateProfileMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-general-start-page">Página inicial padrão</Label>
                    <Select
                      value={startPage}
                      onValueChange={setStartPage}
                      disabled={!isEditingAccount || updateProfileMutation.isPending}
                    >
                      <SelectTrigger
                        id="settings-general-start-page"
                        aria-label="Página inicial padrão"
                        className="bg-input border-border"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {START_PAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Define a primeira tela ideal para abrir quando entrar no app.
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/80 bg-muted/25 p-3">
                    <div>
                      <p className="text-sm font-medium">Receber emails da Orbita</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Novidades, alertas e informações importantes da plataforma.
                      </p>
                    </div>
                    <Switch
                      checked={accountForm.marketingOptIn}
                      onCheckedChange={(checked) =>
                        setAccountForm((prev) => ({ ...prev, marketingOptIn: checked }))
                      }
                      disabled={!isEditingAccount || updateProfileMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                {isEditingAccount ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelAccountEdit}
                      disabled={updateProfileMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveGeneral} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditingAccount(true)}>Editar</Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Segurança da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user?.emailVerified ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                    <p className="text-sm font-medium">
                      Confirme seu email antes de trocar a senha
                    </p>
                    <p className="text-xs text-muted-foreground">
                      A troca de senha só é liberada para contas com email verificado.
                    </p>
                    <Button
                      onClick={() => resendVerificationMutation.mutate()}
                      disabled={resendVerificationMutation.isPending}
                    >
                      {resendVerificationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Reenviar email de verificação"
                      )}
                    </Button>
                  </div>
                ) : canChangePassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-security-current-password">Senha atual</Label>
                      <Input
                        id="settings-security-current-password"
                        name="settings-security-current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-input border-border"
                        disabled={changePasswordMutation.isPending}
                      />
                      <div className="pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          disabled={requestPasswordResetMutation.isPending || !user?.email}
                          onClick={() => {
                            if (!user?.email) {
                              toast.error("Não encontramos um email cadastrado para recuperação.");
                              return;
                            }
                            requestPasswordResetMutation.mutate({ email: user.email });
                          }}
                        >
                          {requestPasswordResetMutation.isPending
                            ? "Enviando link de recuperação..."
                            : "Esqueci a senha atual (enviar recuperação por email)"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="settings-security-new-password">Nova senha</Label>
                      <Input
                        id="settings-security-new-password"
                        name="settings-security-new-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-input border-border"
                        disabled={changePasswordMutation.isPending}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="settings-security-confirm-password">Confirmar nova senha</Label>
                      <Input
                        id="settings-security-confirm-password"
                        name="settings-security-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="bg-input border-border"
                        disabled={changePasswordMutation.isPending}
                      />
                    </div>

                    <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                      <p className="text-xs text-muted-foreground">
                        Exigimos senha forte: 8+ caracteres, sem espaços, com maiúscula,
                        minúscula, número e especial.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Alterar senha
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                    <p className="text-sm font-medium">Conta com login social</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta conta não possui senha local para troca neste momento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Alertas e Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: "settings-notif-task-reminders",
                    label: "Lembretes de tarefas",
                    desc: "Avisar sobre tarefas próximas do prazo ou em atraso.",
                    value: notifTaskReminders,
                    onChange: setNotifTaskReminders,
                  },
                  {
                    id: "settings-notif-daily-briefing",
                    label: "Resumo diário",
                    desc: "Receber o Daily Briefing com foco do dia.",
                    value: notifDailyBriefing,
                    onChange: setNotifDailyBriefing,
                  },
                  {
                    id: "settings-notif-finance-alerts",
                    label: "Alertas financeiros",
                    desc: "Notificar contas vencidas e movimentações importantes.",
                    value: notifFinanceAlerts,
                    onChange: setNotifFinanceAlerts,
                  },
                  {
                    id: "settings-notif-crm-alerts",
                    label: "Alertas de CRM",
                    desc: "Avisar sobre leads sem follow-up e mudanças de estágio.",
                    value: notifCrmAlerts,
                    onChange: setNotifCrmAlerts,
                  },
                ].map(({ id, label, desc, value, onChange }) => (
                  <div key={id} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                    <div>
                      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <Switch id={id} checked={value} onCheckedChange={onChange} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4 mr-2" />Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productivity">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Rotina e Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
                  <div>
                    <Label htmlFor="settings-routine-week-start" className="text-sm font-medium cursor-pointer">
                      Semana começa na segunda-feira
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Organiza calendário e agenda com segunda como primeiro dia.
                    </p>
                  </div>
                  <Switch
                    id="settings-routine-week-start"
                    checked={weekStartsOnMonday}
                    onCheckedChange={setWeekStartsOnMonday}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
                  <div>
                    <Label htmlFor="settings-routine-briefing-login" className="text-sm font-medium cursor-pointer">
                      Mostrar Daily Briefing ao entrar
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Exibe o resumo do dia na abertura do app.
                    </p>
                  </div>
                  <Switch
                    id="settings-routine-briefing-login"
                    checked={showDailyBriefingOnLogin}
                    onCheckedChange={setShowDailyBriefingOnLogin}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-routine-task-goal">Meta diária de leads no CRM</Label>
                    <Input
                      id="settings-routine-task-goal"
                      name="settings-routine-task-goal"
                      type="number"
                      min={1}
                      max={50}
                      value={taskGoal}
                      onChange={(e) => setTaskGoal(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-routine-prospecting-goal">Meta diária de prospecção</Label>
                    <Input
                      id="settings-routine-prospecting-goal"
                      name="settings-routine-prospecting-goal"
                      type="number"
                      min={1}
                      max={50}
                      value={prospectingGoal}
                      onChange={(e) => setProspectingGoal(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">
                    Essas metas são usadas nos widgets de Dashboard e Prospecção para acompanhar evolução diária.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProductivity}>
                    <Save className="w-4 h-4 mr-2" />Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Aparência do Orbita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Tema da interface</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha entre tema claro, escuro e variações premium.
                    </p>
                  </div>
                  {switchable ? (
                    <Button variant="outline" onClick={() => toggleTheme?.()} className="shrink-0 gap-2">
                      {theme === "light" ? <MoonStar className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      {theme === "light" ? "Alternar rápido" : "Voltar ao claro"}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tema fixo</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {THEME_OPTIONS.map((option) => {
                    const isActive = theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme?.(option.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-primary ring-2 ring-primary/25 bg-primary/5"
                            : "border-border/80 bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className={`rounded-lg border p-3 ${option.shell}`}>
                          <div className={`h-2.5 w-20 rounded ${option.header}`} />
                          <div className={`mt-2 h-2 w-full rounded ${option.lineA}`} />
                          <div className={`mt-1.5 h-2 w-3/4 rounded ${option.lineB}`} />
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                          </div>
                          {isActive && <Badge className="text-[10px]">Ativo</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">
                    Dica: escolha o tema que deixe sua rotina mais confortável para uso diário prolongado.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Tema salvo com sucesso!")}>
                    <Save className="w-4 h-4 mr-2" />Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>
                      {currentPlan
                        ? PLAN_CARDS.find((plan) => plan.id === currentPlan)?.label ?? currentPlan
                        : "Sem plano definido"}
                    </strong>
                  </p>
                  <p className="text-muted-foreground">
                    Status: <strong>{currentPlanStatus ?? "indefinido"}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Expira em:{" "}
                    <strong>
                      {currentPlanExpiry
                        ? new Date(currentPlanExpiry).toLocaleDateString("pt-BR")
                        : "não definido"}
                    </strong>
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLAN_CARDS.map((plan) => {
                  const isCurrentPlan = currentPlan === plan.id;
                  return (
                    <Card
                      key={plan.id}
                      className="bg-card border-border"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">{plan.label}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.audience}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xl font-bold">{plan.monthlyPrice}</p>
                        <div className="space-y-2">
                          {plan.highlights.map((highlight) => (
                            <p key={highlight} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {highlight}
                            </p>
                          ))}
                        </div>
                        <Button
                          className="w-full"
                          variant="outline"
                          disabled={isCurrentPlan || createSubscriptionMutation.isPending}
                          onClick={() => {
                            if (isCurrentPlan) return;
                            createSubscriptionMutation.mutate({
                              plan: plan.id,
                              billingType: "PIX",
                            });
                          }}
                        >
                          {isCurrentPlan
                            ? "Plano atual"
                            : createSubscriptionMutation.isPending
                              ? "Gerando checkout..."
                              : `Escolher ${plan.label}`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
