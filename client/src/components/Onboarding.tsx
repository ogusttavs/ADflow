import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import {
  Users, BarChart3, Settings, Sparkles, Target, Wallet,
  ChevronRight, X, CheckCircle2, Rocket,
} from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Users,
    title: "1. Adicione seu primeiro cliente",
    description: "Cadastre os dados básicos do cliente para centralizar relacionamento e histórico comercial em um lugar só.",
    action: "Ir para Clientes",
    path: "/clients",
  },
  {
    icon: Target,
    title: "2. Monte sua rotina diária",
    description: "Crie tarefas, hábitos e use o pomodoro para transformar planejamento em execução.",
    action: "Ir para Rotina",
    path: "/routine",
  },
  {
    icon: BarChart3,
    title: "3. Organize seu funil no CRM",
    description: "Gerencie leads por estágio e mantenha follow-ups em dia para não perder oportunidades.",
    action: "Ir para CRM",
    path: "/crm",
  },
  {
    icon: Wallet,
    title: "4. Configure o financeiro",
    description: "Registre lançamentos de CPF/CNPJ e acompanhe recorrências para ter visão real de saldo e fluxo.",
    action: "Ir para Financeiro",
    path: "/financeiro",
  },
  {
    icon: Settings,
    title: "5. Ajuste o app para seu ritmo",
    description: "Defina metas e preferências em Configurações para deixar o Orbita com a sua rotina.",
    action: "Ir para Configurações",
    path: "/settings",
  },
];

export default function Onboarding({ onComplete, onDismiss }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [, navigate] = useLocation();

  const progress = (completedSteps.length / STEPS.length) * 100;

  const markComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
    if (step < STEPS.length - 1) {
      setCurrentStep(step + 1);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Bem-vindo ao Orbita!</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss}><X className="h-4 w-4" /></Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Siga estes passos para deixar seu app pronto para uso diário.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm font-medium">{completedSteps.length}/{STEPS.length}</span>
        </div>

        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.includes(i);
            const isCurrent = currentStep === i;

            return (
              <div key={i}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isCurrent ? "bg-primary/10 border border-primary/20" :
                  isCompleted ? "bg-muted/30 opacity-70" : "hover:bg-muted/50"
                }`}
                onClick={() => setCurrentStep(i)}>
                <div className={`mt-0.5 flex-shrink-0 ${isCompleted ? "text-green-500" : isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                  {isCurrent && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                          navigate(step.path);
                        }}>
                          {step.action} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => markComplete(i)}>
                          Marcar como feito
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {completedSteps.length === STEPS.length && (
          <Button className="w-full mt-4 gap-2" onClick={onComplete}>
            <Sparkles className="h-4 w-4" /> Concluir Onboarding
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
