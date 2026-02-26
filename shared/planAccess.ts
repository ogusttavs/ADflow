export const BILLING_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

export const ORBITA_PLAN_VALUES = [
  "personal_standard",
  "personal_pro",
  "business_standard",
  "business_pro",
] as const;

export const ORBITA_PLAN_STATUS_VALUES = [
  "trial",
  "active",
  "past_due",
  "expired",
  "canceled",
] as const;

export const PLAN_FEATURE_VALUES = ["clients", "crm", "prospecting"] as const;

export type OrbitaPlan = (typeof ORBITA_PLAN_VALUES)[number];
export type OrbitaPlanStatus = (typeof ORBITA_PLAN_STATUS_VALUES)[number];
export type PlanFeature = (typeof PLAN_FEATURE_VALUES)[number];

const PLAN_FEATURES: Record<PlanFeature, OrbitaPlan[]> = {
  clients: ["business_standard", "business_pro"],
  crm: ["business_standard", "business_pro"],
  prospecting: ["business_standard", "business_pro"],
};

export function hasPlanAccess(plan: OrbitaPlan | null | undefined, feature: PlanFeature): boolean {
  if (!plan) return false;
  return PLAN_FEATURES[feature].includes(plan);
}

export function canUsePaidFeatures(params: {
  planStatus: OrbitaPlanStatus | null | undefined;
  planExpiry: Date | string | null | undefined;
  now?: number;
}): boolean {
  const { planStatus, planExpiry } = params;
  const now = params.now ?? Date.now();

  if (planStatus === "active" || planStatus === "trial") return true;
  if (planStatus !== "past_due") return false;
  if (!planExpiry) return false;

  const expiryTime = planExpiry instanceof Date ? planExpiry.getTime() : new Date(planExpiry).getTime();
  if (Number.isNaN(expiryTime)) return false;

  return now - expiryTime <= BILLING_GRACE_PERIOD_MS;
}

export function canUseFeature(params: {
  plan: OrbitaPlan | null | undefined;
  planStatus: OrbitaPlanStatus | null | undefined;
  planExpiry: Date | string | null | undefined;
  feature: PlanFeature;
  now?: number;
}): boolean {
  return hasPlanAccess(params.plan, params.feature) &&
    canUsePaidFeatures({
      planStatus: params.planStatus,
      planExpiry: params.planExpiry,
      now: params.now,
    });
}

