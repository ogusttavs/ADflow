import AppLayout from "@/components/AppLayout";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
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
  MoonStar,
  Sun,
  Settings as SettingsIcon,
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

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, toggleTheme, switchable } = useTheme();

  const [accountDisplayName, setAccountDisplayName] = useState(() =>
    getSettingString(USER_SETTINGS_KEYS.accountDisplayName, "")
  );
  const [accountMainEmail, setAccountMainEmail] = useState(() =>
    getSettingString(USER_SETTINGS_KEYS.accountMainEmail, "")
  );
  const [accountWhatsapp, setAccountWhatsapp] = useState(() =>
    getSettingString(USER_SETTINGS_KEYS.accountWhatsapp, "+55 11 99999-9999")
  );
  const [accountCityState, setAccountCityState] = useState(() =>
    getSettingString(USER_SETTINGS_KEYS.accountCityState, "São Paulo / SP")
  );
  const [accountContext, setAccountContext] = useState(() =>
    getSettingString(
      USER_SETTINGS_KEYS.accountContext,
      "Uso o Orbita para organizar rotina pessoal, metas e operação comercial."
    )
  );
  const [interfaceLanguage, setInterfaceLanguage] = useState(() =>
    getSettingString(USER_SETTINGS_KEYS.interfaceLanguage, "Português Brasileiro (pt-BR)")
  );
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

  useEffect(() => {
    try {
      const hasStoredDisplayName = localStorage.getItem(USER_SETTINGS_KEYS.accountDisplayName);
      const hasStoredMainEmail = localStorage.getItem(USER_SETTINGS_KEYS.accountMainEmail);
      if (!hasStoredDisplayName && user?.name) {
        setAccountDisplayName(user.name);
      }
      if (!hasStoredMainEmail && user?.email) {
        setAccountMainEmail(user.email);
      }
    } catch {
      if (user?.name) setAccountDisplayName((prev) => prev || user.name || "");
      if (user?.email) setAccountMainEmail((prev) => prev || user.email || "");
    }
  }, [user?.email, user?.name]);

  const handleSaveGeneral = () => {
    const safeDisplayName = accountDisplayName.trim() || user?.name || "Usuário";
    const safeMainEmail = accountMainEmail.trim() || user?.email || "";
    const safeLanguage = interfaceLanguage.trim() || "Português Brasileiro (pt-BR)";
    const safeStartPage = normalizeStartPageRoute(startPage);

    setAccountDisplayName(safeDisplayName);
    setAccountMainEmail(safeMainEmail);
    setInterfaceLanguage(safeLanguage);
    setStartPage(safeStartPage);

    setSetting(USER_SETTINGS_KEYS.accountDisplayName, safeDisplayName);
    setSetting(USER_SETTINGS_KEYS.accountMainEmail, safeMainEmail);
    setSetting(USER_SETTINGS_KEYS.accountWhatsapp, accountWhatsapp.trim());
    setSetting(USER_SETTINGS_KEYS.accountCityState, accountCityState.trim());
    setSetting(USER_SETTINGS_KEYS.accountContext, accountContext.trim());
    setSetting(USER_SETTINGS_KEYS.interfaceLanguage, safeLanguage);
    setSetting(USER_SETTINGS_KEYS.startPage, safeStartPage);

    toast.success("Configurações da conta salvas com sucesso!");
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

        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start overflow-x-auto [&>button]:flex-none [&>button]:shrink-0">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <UserRound className="w-4 h-4" />Conta
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
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Perfil da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-display-name">Nome de exibição</Label>
                      <Input
                        id="settings-account-display-name"
                        name="settings-account-display-name"
                        value={accountDisplayName}
                        onChange={(e) => setAccountDisplayName(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-main-email">E-mail principal</Label>
                      <Input
                        id="settings-account-main-email"
                        name="settings-account-main-email"
                        type="email"
                        value={accountMainEmail}
                        onChange={(e) => setAccountMainEmail(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-whatsapp">WhatsApp</Label>
                      <Input
                        id="settings-account-whatsapp"
                        name="settings-account-whatsapp"
                        value={accountWhatsapp}
                        onChange={(e) => setAccountWhatsapp(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-account-city-state">Cidade / UF</Label>
                      <Input
                        id="settings-account-city-state"
                        name="settings-account-city-state"
                        value={accountCityState}
                        onChange={(e) => setAccountCityState(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-account-context">Como você usa o Orbita no dia a dia</Label>
                    <Textarea
                      id="settings-account-context"
                      name="settings-account-context"
                      rows={3}
                      className="bg-input border-border resize-none"
                      value={accountContext}
                      onChange={(e) => setAccountContext(e.target.value)}
                    />
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
                      value={interfaceLanguage}
                      onChange={(e) => setInterfaceLanguage(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-general-start-page">Página inicial padrão</Label>
                    <Select value={startPage} onValueChange={setStartPage}>
                      <SelectTrigger id="settings-general-start-page" aria-label="Página inicial padrão" className="bg-input border-border">
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
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}>
                  <Save className="w-4 h-4 mr-2" />Salvar
                </Button>
              </div>
            </div>
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
