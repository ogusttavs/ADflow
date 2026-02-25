export const USER_SETTINGS_KEYS = {
  accountDisplayName: "orbita_settings_account_display_name",
  accountMainEmail: "orbita_settings_account_main_email",
  accountWhatsapp: "orbita_settings_account_whatsapp",
  accountCityState: "orbita_settings_account_city_state",
  accountContext: "orbita_settings_account_context",
  interfaceLanguage: "orbita_settings_interface_language",
  startPage: "orbita_settings_start_page",
  notifTaskReminders: "orbita_settings_notif_task_reminders",
  notifDailyBriefing: "orbita_settings_notif_daily_briefing",
  notifFinanceAlerts: "orbita_settings_notif_finance_alerts",
  notifCrmAlerts: "orbita_settings_notif_crm_alerts",
  weekStartsOnMonday: "orbita_settings_week_starts_on_monday",
  showDailyBriefingOnLogin: "orbita_settings_show_daily_briefing_on_login",
  dailyTaskGoal: "daily_task_goal",
  dailyLeadAddGoal: "daily_lead_add_goal",
  dailyLeadProspectGoal: "daily_lead_prospect_goal",
} as const;

export const START_PAGE_OPTIONS = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/routine", label: "Minha Rotina" },
  { value: "/agenda", label: "Agenda" },
  { value: "/crm", label: "CRM / Leads" },
  { value: "/financeiro", label: "Financeiro" },
  { value: "/clients", label: "Clientes" },
] as const;

const START_PAGE_ALIASES: Record<string, string> = {
  dashboard: "/dashboard",
  "minha rotina": "/routine",
  rotina: "/routine",
  agenda: "/agenda",
  "crm / leads": "/crm",
  crm: "/crm",
  financeiro: "/financeiro",
  clientes: "/clients",
};

export function normalizeStartPageRoute(value: string | null | undefined) {
  if (!value) return "/dashboard";
  const trimmed = value.trim();
  if (START_PAGE_OPTIONS.some((option) => option.value === trimmed)) return trimmed;
  const alias = START_PAGE_ALIASES[trimmed.toLowerCase()];
  return alias ?? "/dashboard";
}

export function getStartPageRoute() {
  const saved = getSettingString(USER_SETTINGS_KEYS.startPage, "/dashboard");
  return normalizeStartPageRoute(saved);
}

export function getSettingString(key: string, fallback: string) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

export function getSettingBoolean(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "true";
  } catch {
    return fallback;
  }
}

export function getSettingNumber(key: string, fallback: number) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function setSetting(key: string, value: string | number | boolean) {
  localStorage.setItem(key, String(value));
}

export function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
