import { hasPlanAccess, type OrbitaPlan } from "@shared/planAccess";

export type OnboardingStepId =
  | "dashboard"
  | "clients"
  | "crm"
  | "routine"
  | "agenda"
  | "financeiro"
  | "settings";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  action: string;
  path: string;
};

export type OnboardingState = {
  completedStepIds: OnboardingStepId[];
  completedAt: string | null;
  dismissedAt: string | null;
  reopenRequestedAt: string | null;
  updatedAt: string | null;
};

const STORAGE_PREFIX = "orbita_onboarding_state";

const ALL_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "dashboard",
    title: "Leia seu painel inicial",
    description:
      "Entenda a visão geral do dia, ajuste widgets e veja o que merece atenção agora.",
    action: "Ir para Dashboard",
    path: "/dashboard",
  },
  {
    id: "clients",
    title: "Adicione seu primeiro cliente",
    description:
      "Centralize os dados principais do cliente para começar com contexto organizado.",
    action: "Ir para Clientes",
    path: "/clients",
  },
  {
    id: "crm",
    title: "Organize seu funil no CRM",
    description:
      "Acompanhe leads por estágio e mantenha follow-ups vivos sem perder oportunidade.",
    action: "Ir para CRM",
    path: "/crm",
  },
  {
    id: "routine",
    title: "Monte sua rotina diária",
    description:
      "Crie tarefas, hábitos e use o pomodoro para transformar planejamento em execução.",
    action: "Ir para Rotina",
    path: "/routine",
  },
  {
    id: "agenda",
    title: "Organize agenda e diário",
    description:
      "Registre compromissos, anotações e contexto do dia para não depender de memória.",
    action: "Ir para Agenda",
    path: "/agenda",
  },
  {
    id: "financeiro",
    title: "Configure o financeiro",
    description:
      "Registre lançamentos e recorrências para ter visão real de saldo e vencimentos.",
    action: "Ir para Financeiro",
    path: "/financeiro",
  },
  {
    id: "settings",
    title: "Ajuste o app ao seu ritmo",
    description:
      "Defina preferências, metas e dados da conta para o Orbita refletir sua operação.",
    action: "Ir para Configurações",
    path: "/settings",
  },
] as const;

export function getOnboardingSteps(plan?: OrbitaPlan | null) {
  const hasBusinessModules = hasPlanAccess(plan, "clients") && hasPlanAccess(plan, "crm");
  return hasBusinessModules
    ? ALL_ONBOARDING_STEPS.filter((step) =>
        ["dashboard", "clients", "crm", "routine", "financeiro", "settings"].includes(step.id),
      )
    : ALL_ONBOARDING_STEPS.filter((step) =>
        ["dashboard", "routine", "agenda", "financeiro", "settings"].includes(step.id),
      );
}

const EMPTY_STATE: OnboardingState = {
  completedStepIds: [],
  completedAt: null,
  dismissedAt: null,
  reopenRequestedAt: null,
  updatedAt: null,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStorageKey(openId?: string | null) {
  return `${STORAGE_PREFIX}:${openId?.trim() || "anonymous"}`;
}

function normalizeCompletedStepIds(value: unknown): OnboardingStepId[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(ALL_ONBOARDING_STEPS.map((step) => step.id));
  return value.filter((item): item is OnboardingStepId => typeof item === "string" && validIds.has(item as OnboardingStepId));
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeState(value: unknown): OnboardingState {
  if (!value || typeof value !== "object") return EMPTY_STATE;
  const record = value as Record<string, unknown>;
  return {
    completedStepIds: normalizeCompletedStepIds(record.completedStepIds),
    completedAt: normalizeNullableString(record.completedAt),
    dismissedAt: normalizeNullableString(record.dismissedAt),
    reopenRequestedAt: normalizeNullableString(record.reopenRequestedAt),
    updatedAt: normalizeNullableString(record.updatedAt),
  };
}

export function getOnboardingState(openId?: string | null): OnboardingState {
  if (!canUseStorage()) return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(getStorageKey(openId));
    if (!raw) return EMPTY_STATE;
    return normalizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

function persistOnboardingState(openId: string | null | undefined, state: OnboardingState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(getStorageKey(openId), JSON.stringify(state));
}

function updateOnboardingState(
  openId: string | null | undefined,
  updater: (current: OnboardingState) => OnboardingState,
) {
  const next = updater(getOnboardingState(openId));
  persistOnboardingState(openId, next);
  return next;
}

export function isOnboardingComplete(openId?: string | null) {
  return Boolean(getOnboardingState(openId).completedAt);
}

export function isOnboardingSettled(openId?: string | null) {
  const state = getOnboardingState(openId);
  return Boolean(state.completedAt || state.dismissedAt);
}

export function shouldAutoOpenOnboarding(openId?: string | null) {
  const state = getOnboardingState(openId);
  return Boolean(state.reopenRequestedAt || (!state.completedAt && !state.dismissedAt));
}

export function getOnboardingProgress(state: OnboardingState, plan?: OrbitaPlan | null) {
  const steps = getOnboardingSteps(plan);
  if (steps.length === 0) return 0;
  const completed = steps.filter((step) => state.completedStepIds.includes(step.id)).length;
  return Math.round((completed / steps.length) * 100);
}

export function getNextOnboardingStep(openId?: string | null, plan?: OrbitaPlan | null) {
  const state = getOnboardingState(openId);
  const steps = getOnboardingSteps(plan);
  return steps.find((step) => !state.completedStepIds.includes(step.id)) ?? steps[0] ?? null;
}

export function markOnboardingStepDone(openId: string | null | undefined, stepId: OnboardingStepId) {
  return updateOnboardingState(openId, (current) => {
    const completedStepIds = current.completedStepIds.includes(stepId)
      ? current.completedStepIds
      : [...current.completedStepIds, stepId];
    return {
      ...current,
      completedStepIds,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function markOnboardingCompleted(openId: string | null | undefined) {
  return updateOnboardingState(openId, (current) => ({
    ...current,
    completedStepIds: ALL_ONBOARDING_STEPS.map((step) => step.id),
    completedAt: current.completedAt ?? new Date().toISOString(),
    dismissedAt: null,
    reopenRequestedAt: null,
    updatedAt: new Date().toISOString(),
  }));
}

export function dismissOnboarding(openId: string | null | undefined) {
  return updateOnboardingState(openId, (current) => ({
    ...current,
    dismissedAt: current.dismissedAt ?? new Date().toISOString(),
    reopenRequestedAt: null,
    updatedAt: new Date().toISOString(),
  }));
}

export function requestOnboardingReopen(openId: string | null | undefined) {
  return updateOnboardingState(openId, (current) => ({
    ...current,
    reopenRequestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function clearOnboardingReopenRequest(openId: string | null | undefined) {
  return updateOnboardingState(openId, (current) => ({
    ...current,
    reopenRequestedAt: null,
    updatedAt: new Date().toISOString(),
  }));
}
