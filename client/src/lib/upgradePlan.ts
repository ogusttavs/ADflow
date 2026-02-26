import type { PlanFeature } from "@shared/planAccess";

export const UPGRADE_REQUIRED_EVENT = "orbita:upgrade-required";

export type UpgradeRequiredEventDetail = {
  feature?: PlanFeature;
  source?: "nav" | "api" | "route";
};

export function emitUpgradeRequired(detail: UpgradeRequiredEventDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UpgradeRequiredEventDetail>(UPGRADE_REQUIRED_EVENT, { detail }));
}

