import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import {
  Users, Megaphone, MessageSquare, BarChart3, Settings, Sparkles,
  ChevronRight, X, CheckCircle2, Rocket,
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Users,
    title: "1. Adicione seu primeiro cliente",
    description: "Vá em Clientes e cadastre os dados do seu cliente: nome, empresa, tom de voz, público-alvo e produtos. Esses dados pré-definidos serão usados pela IA para gerar conteúdo personalizado.",
    action: "Ir para Clientes",
    path: "/clients",
  },
  {
    icon: Megaphone,
    title: "2. Crie sua primeira campanha",
    description: "Em Campanhas, selecione o cliente e descreva o objetivo. A IA vai gerar automaticamente a estratégia, cópias para cada canal e criativos visuais.",
    action: "Ir para Campanhas",
    path: "/campaigns",
  },
  {
    icon: MessageSquare,
    title: "3. Configure o WhatsApp Bot",
    description: "Na página WhatsApp Bot, copie o URL do webhook e configure no Meta Business Manager. Assim seus clientes poderão solicitar campanhas directamente pelo WhatsApp.",
    action: "Ir para WhatsApp",
    path: "/whatsapp",
  },
  {
    icon: BarChart3,
    title: "4. Acompanhe a Performance",
    description: "Use o Dashboard de Performance para monitorar ROAS, CPA e CTR por canal. A IA gera alertas preditivos quando detecta queda de performance.",
    action: "Ir para Performance",
    path: "/performance",
  },
  {
    icon: Sparkles,
    title: "5. Use o CRM com IA",
    description: "No CRM, gerencie seu funil de vendas e use a IA para gerar listas de leads ideais baseadas no perfil do seu negócio.",
    action: "Ir para CRM",
    path: "/crm",
  },
  {
    icon: Settings,
    title: "6. Configure as Integrações",
    description: "Conecte suas contas de redes sociais e APIs (Freepik, Meta Ads, Google Ads) para activar publicação automática e importação de métricas reais.",
    action: "Ir para Integrações",
    path: "/integrations",
  },
];

export default function Onboarding({ onComplete, onDismiss }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

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
            <h3 className="font-bold">Bem-vindo ao AdFlow AI!</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss}><X className="h-4 w-4" /></Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Siga estes passos para configurar sua agência de marketing automatizada com IA.
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
                          window.location.hash = step.path;
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
