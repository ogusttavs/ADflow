import type { OrbitaPlan } from "@shared/planAccess";

export type PlanCard = {
  id: OrbitaPlan;
  label: string;
  audience: string;
  monthlyPrice: string;
  highlights: string[];
};

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "personal_standard",
    label: "Pessoal Standard",
    audience: "Profissional autônomo iniciando",
    monthlyPrice: "R$ 29/mês",
    highlights: ["Rotina e tarefas", "Diário e sonhos", "Painel pessoal"],
  },
  {
    id: "personal_pro",
    label: "Pessoal Pro",
    audience: "Uso pessoal com mais recursos",
    monthlyPrice: "R$ 49/mês",
    highlights: ["Tudo do Standard", "Fluxos avançados", "Prioridade de suporte"],
  },
  {
    id: "business_standard",
    label: "Business Standard",
    audience: "Operação comercial ativa",
    monthlyPrice: "R$ 99/mês",
    highlights: ["Clientes", "CRM", "Prospecção"],
  },
  {
    id: "business_pro",
    label: "Business Pro",
    audience: "Equipe com demanda alta",
    monthlyPrice: "R$ 149/mês",
    highlights: ["Tudo do Business Standard", "Maior escala", "Prioridade máxima"],
  },
];

export function getPlanCard(plan: OrbitaPlan | null | undefined) {
  if (!plan) return null;
  return PLAN_CARDS.find((card) => card.id === plan) ?? null;
}

export function getPlanCheckoutIntentUrl(plan: OrbitaPlan) {
  return `/login?tab=register&checkout=1&plan=${encodeURIComponent(plan)}`;
}
