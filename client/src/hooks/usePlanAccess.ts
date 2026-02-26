import { useAuth } from "@/_core/hooks/useAuth";
import { canUseFeature, type PlanFeature } from "@shared/planAccess";

export function usePlanAccess(feature: PlanFeature) {
  const { user, loading } = useAuth();

  const hasAccess = Boolean(
    user &&
      canUseFeature({
        plan: user.plan,
        planStatus: user.planStatus,
        planExpiry: user.planExpiry,
        feature,
      }),
  );

  return {
    hasAccess,
    loading,
    userPlan: user?.plan ?? null,
    userPlanStatus: user?.planStatus ?? null,
    userPlanExpiry: user?.planExpiry ?? null,
  };
}

