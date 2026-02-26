import { useMemo } from "react";
import type { PlanFeature } from "@shared/planAccess";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { emitUpgradeRequired } from "@/lib/upgradePlan";

type PlanGateProps = {
  feature: PlanFeature;
  children: React.ReactNode;
};

const FEATURE_LABEL: Record<PlanFeature, string> = {
  clients: "Clientes",
  crm: "CRM",
  prospecting: "Prospecção",
};

export function PlanGate({ feature, children }: PlanGateProps) {
  const { hasAccess, loading } = usePlanAccess(feature);

  const featureLabel = useMemo(() => FEATURE_LABEL[feature], [feature]);

  if (loading) return <>{children}</>;
  if (hasAccess) return <>{children}</>;

  return (
    <div className="page-content">
      <Card className="max-w-3xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Upgrade de plano necessário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O módulo <strong>{featureLabel}</strong> não está incluído no seu plano atual.
          </p>
          <Button onClick={() => emitUpgradeRequired({ feature, source: "route" })}>
            Ver opções de plano
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
