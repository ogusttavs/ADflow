import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, CheckCircle2, ChevronRight, Rocket, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  clearOnboardingReopenRequest,
  dismissOnboarding,
  getOnboardingSteps,
  getOnboardingProgress,
  getOnboardingState,
  markOnboardingCompleted,
  markOnboardingStepDone,
  type OnboardingStepId,
} from "@/lib/onboarding";
import type { OrbitaPlan } from "@shared/planAccess";

interface OnboardingProps {
  openId?: string | null;
  plan?: OrbitaPlan | null;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function Onboarding({ openId, plan, onComplete, onDismiss }: OnboardingProps) {
  const [, navigate] = useLocation();
  const [completedStepIds, setCompletedStepIds] = useState<OnboardingStepId[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = useMemo(() => getOnboardingSteps(plan), [plan]);
  const focusLabel = steps.some((step) => step.id === "clients" || step.id === "crm")
    ? "Foco: painel, comercial, rotina e financeiro"
    : "Foco: painel, rotina, agenda e financeiro";

  useEffect(() => {
    const state = getOnboardingState(openId);
    setCompletedStepIds(state.completedStepIds);
    const nextIndex = steps.findIndex((step) => !state.completedStepIds.includes(step.id));
    setCurrentStep(nextIndex >= 0 ? nextIndex : 0);
    clearOnboardingReopenRequest(openId);
  }, [openId, steps]);

  const onboardingState = useMemo(
    () => ({
      ...getOnboardingState(openId),
      completedStepIds,
    }),
    [completedStepIds, openId],
  );

  const progress = getOnboardingProgress(onboardingState, plan);
  const completedStepCount = steps.filter((step) => completedStepIds.includes(step.id)).length;
  const allStepsCompleted = completedStepCount === steps.length;

  const handleMarkStepDone = (stepId: OnboardingStepId, index: number) => {
    const nextState = markOnboardingStepDone(openId, stepId);
    setCompletedStepIds(nextState.completedStepIds);
    if (index < steps.length - 1) {
      const nextIndex = steps.findIndex((step) => !nextState.completedStepIds.includes(step.id));
      setCurrentStep(nextIndex >= 0 ? nextIndex : index);
    }
  };

  const handleDismiss = () => {
    dismissOnboarding(openId);
    onDismiss();
  };

  const handleComplete = () => {
    markOnboardingCompleted(openId);
    onComplete();
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-sky-500/5">
      <CardContent className="p-0">
        <div className="border-b border-primary/10 bg-background/70 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 text-primary">Primeiro acesso</Badge>
                <Badge variant="outline" className="border-border/80">
                  {steps.length} passos
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Bem-vindo ao Orbita</h3>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Este checklist te leva pelos modulos essenciais para sair do zero e deixar a plataforma pronta
                  para uso real no mesmo dia.
                </p>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  Tempo medio: 7 minutos
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  {focusLabel}
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  Ajuda dedicada em cada etapa
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} aria-label="Fechar onboarding">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{completedStepCount}/{steps.length}</span>
          </div>
        </div>

        <div className="space-y-3 p-6">
          {steps.map((step, index) => {
            const isCompleted = completedStepIds.includes(step.id);
            const isCurrent = currentStep === index || (!allStepsCompleted && !isCompleted && currentStep === 0 && index === 0);

            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-border bg-background/80"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isCompleted ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isCompleted ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : isCurrent
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : ""
                    }
                  >
                    {isCompleted ? "Concluido" : isCurrent ? "Agora" : "Proximo"}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setCurrentStep(index);
                      navigate(step.path);
                    }}
                  >
                    {step.action}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkStepDone(step.id, index)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Passo concluido" : "Marcar como feito"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => navigate("/help")}
                  >
                    <BookOpen className="h-3 w-3" />
                    Ver ajuda desta etapa
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap justify-between gap-3 border-t border-border/70 pt-4">
            <Button variant="ghost" onClick={handleDismiss}>
              Pular por agora
            </Button>
            <Button className="gap-2" onClick={handleComplete} disabled={!allStepsCompleted}>
              <Sparkles className="h-4 w-4" />
              Concluir onboarding
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
