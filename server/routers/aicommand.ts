import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { dailyTasks, clients, campaigns } from "../../drizzle/schema";

const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "addTask",
      description: "Adiciona uma nova tarefa ao sistema de produtividade do usuário",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          dueDate: { type: "string", description: "Data no formato YYYY-MM-DD" },
          dueTime: { type: "string", description: "Hora no formato HH:MM (opcional)" },
          priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"], description: "Prioridade" },
          category: { type: "string", enum: ["WORK", "PERSONAL", "OTHER"], description: "Categoria" },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createCampaign",
      description: "Inicia o fluxo de criação de uma nova campanha de marketing para um cliente",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string", description: "Nome do cliente para quem a campanha será criada" },
          title: { type: "string", description: "Título/tema da campanha (ex: Black Friday, Lançamento)" },
          channels: {
            type: "array",
            items: { type: "string", enum: ["instagram", "facebook", "tiktok", "linkedin"] },
            description: "Canais onde a campanha será publicada",
          },
        },
        required: ["clientName", "title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "navigate",
      description: "Navega para uma página específica da plataforma",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["dashboard", "clients", "campaigns", "crm", "calendar", "whatsapp", "performance", "abtests", "reports", "budget", "utm", "referrals", "routine", "integrations", "settings", "notifications"],
            description: "Página de destino",
          },
          filter: { type: "string", description: "Filtro opcional (ex: 'qualificados' para CRM)" },
        },
        required: ["page"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "startPomodoro",
      description: "Inicia um timer Pomodoro de trabalho focado",
      parameters: {
        type: "object",
        properties: {
          durationMinutes: { type: "number", description: "Duração em minutos (padrão: 25)" },
          label: { type: "string", description: "Rótulo da sessão (ex: 'Criar copies para MyCreatine')" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchLeads",
      description: "Busca leads no CRM com filtros específicos",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost", "all"], description: "Estágio do lead no funil" },
          query: { type: "string", description: "Texto de busca (nome, empresa, email)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "addClient",
      description: "Adiciona um novo cliente à plataforma",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do cliente" },
          company: { type: "string", description: "Nome da empresa" },
          email: { type: "string", description: "Email do cliente" },
          industry: { type: "string", description: "Setor/indústria do cliente" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
];

export const aiCommandRouter = router({
  execute: protectedProcedure
    .input(z.object({ command: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é o assistente de IA da plataforma AdFlow AI, uma plataforma de automação de marketing.
Interprete o comando do usuário e execute a ação apropriada usando as ferramentas disponíveis.
Data de hoje: ${today}. Amanhã: ${tomorrow}.
Se o comando for ambíguo, escolha a ação mais provável.
Se não conseguir mapear para nenhuma ferramenta, responda com uma mensagem útil.
Sempre responda em português do Brasil.`,
          },
          { role: "user", content: input.command },
        ],
        tools: AI_TOOLS,
        tool_choice: "auto",
      });

      const message = response.choices?.[0]?.message;
      if (!message) {
        return { type: "message" as const, text: "Não consegui processar o comando. Tente novamente." };
      }

      // If the model wants to call a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const fnName = toolCall.function.name;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch { /* empty args */ }

        switch (fnName) {
          case "addTask": {
            const db = await getDb();
            if (!db) return { type: "error" as const, text: "Banco de dados indisponível" };
            const result = await db.insert(dailyTasks).values({
              userId: ctx.user.id,
              title: (args.title as string) || "Nova tarefa",
              dueDate: (args.dueDate as string) || today,
              dueTime: (args.dueTime as string) || null,
              priority: (args.priority as string) || "MEDIUM",
              category: (args.category as string) || "WORK",
            });
            return {
              type: "action" as const,
              action: "taskCreated",
              data: { id: Number(result[0].insertId), title: args.title, dueDate: args.dueDate || today },
              text: `Tarefa "${args.title}" criada para ${args.dueDate || "hoje"}${args.dueTime ? ` às ${args.dueTime}` : ""}.`,
            };
          }

          case "createCampaign": {
            return {
              type: "action" as const,
              action: "navigateToCampaignCreation",
              data: { clientName: args.clientName, title: args.title, channels: args.channels },
              text: `Preparando campanha "${args.title}" para ${args.clientName}. Redirecionando...`,
            };
          }

          case "navigate": {
            const pageMap: Record<string, string> = {
              dashboard: "/dashboard",
              clients: "/clients",
              campaigns: "/campaigns",
              crm: "/crm",
              calendar: "/calendar",
              whatsapp: "/whatsapp",
              performance: "/performance",
              abtests: "/ab-tests",
              reports: "/reports",
              budget: "/budget",
              utm: "/utm-builder",
              referrals: "/referrals",
              routine: "/routine",
              integrations: "/integrations",
              settings: "/settings",
              notifications: "/notifications",
            };
            const path = pageMap[args.page as string] || "/dashboard";
            return {
              type: "action" as const,
              action: "navigate",
              data: { path, filter: args.filter },
              text: `Navegando para ${args.page}${args.filter ? ` (filtro: ${args.filter})` : ""}...`,
            };
          }

          case "startPomodoro": {
            return {
              type: "action" as const,
              action: "startPomodoro",
              data: { durationMinutes: args.durationMinutes || 25, label: args.label },
              text: `Iniciando Pomodoro de ${args.durationMinutes || 25} minutos${args.label ? `: ${args.label}` : ""}.`,
            };
          }

          case "searchLeads": {
            return {
              type: "action" as const,
              action: "navigate",
              data: { path: "/crm", filter: args.stage || args.query },
              text: `Buscando leads${args.stage ? ` no estágio "${args.stage}"` : ""}${args.query ? ` com "${args.query}"` : ""}...`,
            };
          }

          case "addClient": {
            const db = await getDb();
            if (!db) return { type: "error" as const, text: "Banco de dados indisponível" };
            const result = await db.insert(clients).values({
              userId: ctx.user.id,
              name: (args.name as string) || "Novo Cliente",
              company: (args.company as string) || null,
              email: (args.email as string) || null,
              industry: (args.industry as string) || null,
            });
            return {
              type: "action" as const,
              action: "clientCreated",
              data: { id: Number(result[0].insertId), name: args.name },
              text: `Cliente "${args.name}" adicionado com sucesso.`,
            };
          }

          default:
            return { type: "message" as const, text: `Ação "${fnName}" não reconhecida.` };
        }
      }

      // If the model just responded with text
      return { type: "message" as const, text: message.content || "Comando processado." };
    }),
});
