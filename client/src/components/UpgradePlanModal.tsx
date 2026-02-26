import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { PlanFeature } from "@shared/planAccess";
import { BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UpgradeRequiredEventDetail } from "@/lib/upgradePlan";
import { UPGRADE_REQUIRED_EVENT } from "@/lib/upgradePlan";

const FEATURE_LABEL: Record<PlanFeature, string> = {
  clients: "Clientes",
  crm: "CRM",
  prospecting: "Prospecção",
};

export function UpgradePlanModal() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<PlanFeature | null>(null);

  useEffect(() => {
    const onUpgradeRequired = (event: Event) => {
      const customEvent = event as CustomEvent<UpgradeRequiredEventDetail>;
      setFeature(customEvent.detail?.feature ?? null);
      setOpen(true);
    };

    window.addEventListener(UPGRADE_REQUIRED_EVENT, onUpgradeRequired);
    return () => {
      window.removeEventListener(UPGRADE_REQUIRED_EVENT, onUpgradeRequired);
    };
  }, []);

  const featureLabel = useMemo(() => {
    if (!feature) return "este recurso";
    return FEATURE_LABEL[feature];
  }, [feature]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            Recurso indisponível no seu plano
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            O módulo <strong>{featureLabel}</strong> não está incluído no seu plano atual.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setOpen(false);
                navigate("/settings?tab=plans");
              }}
            >
              Ver planos
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Agora não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
