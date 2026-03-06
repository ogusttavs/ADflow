# Decisões do Produto — Orbita

> Documento vivo. Atualizar sempre que uma decisão de produto for tomada ou revisada.
> Última atualização: 2026-03-06 09:55:00 -0300
> Baseado nas conversas de planejamento entre dono e Claude.
> Status: oficializado como referência de decisão para os agentes do projeto.

---

## 1. Identidade da marca

| Item | Decisão |
|---|---|
| **Nome** | **Orbita** |
| **Tagline** | "Tudo na sua órbita" |
| **Sub-brand (futuro)** | orbita.adv · orbita.gestores · orbita.clinicas · orbita.médicos |
| **Domínio oficial atual** | getorbita.com.br |
| **Cor principal** | Azul — com MUITA personalidade, não genérico/template |
| **Tipografia** | Inter (corpo) + Space Grotesk (títulos) — manter |
| **Cards compartilháveis** | Sim — para Instagram e redes sociais |

**Como chegamos ao nome:** foram sugeridos 20 nomes durante a conversa de planejamento estratégico. A escolha recaiu sobre "Orbita" por representar a ideia central do produto: vida pessoal, negócio e produtividade girando ao redor da pessoa, em órbita. O nome é curto, memorável, funciona em português e inglês, e suporta bem o padrão de sub-branding vertical (.adv, .gestores, etc.) para expansão futura por nicho.

---

## 2. Estrutura de planos

### 2.1 Tabela completa de planos

| Plano | Preço/mês | Features |
|---|---|---|
| **Pessoal Padrão** | R$29 | Finanças (CPF) · Tarefas (com categorias) · Hábitos · Pomodoro · Agenda (com categorias) · Diário pessoal · Quadro dos sonhos · Registro de ideias (texto + áudio) · API de tempo · Spotify no Pomodoro |
| **Pessoal Pro** | R$49 | Tudo do Pessoal Padrão + **Assistente de Voz com IA** (app) + Assistente de Voz por WhatsApp + IA de análise de processos |
| **Business Padrão** | R$99 | Finanças (CPF + CNPJ) · Clientes · Tarefas (pessoal + empresa) · Agenda unificada (pessoal + empresa) · Diário (pessoal + empresa) · Quadro dos sonhos · CRM / Leads · Prospecção · Registro de ideias (texto + áudio) · API de tempo · Spotify no Pomodoro |
| **Business Pro** | R$149 | Tudo do Business Padrão + **Assistente de Voz com IA** (app) + Assistente de Voz por WhatsApp + IA de análise de processos |

### 2.2 Regras de features — o que vai onde

| Feature | Pessoal Padrão | Pessoal Pro | Business Padrão | Business Pro |
|---|:---:|:---:|:---:|:---:|
| Finanças CPF | ✅ | ✅ | ✅ | ✅ |
| Finanças CNPJ | ❌ | ❌ | ✅ | ✅ |
| Tarefas + Categorias | ✅ | ✅ | ✅ | ✅ |
| Hábitos | ✅ | ✅ | ✅ | ✅ |
| Pomodoro | ✅ | ✅ | ✅ | ✅ |
| Agenda + Categorias | ✅ | ✅ | ✅ (unificada) | ✅ (unificada) |
| Diário | ✅ | ✅ | ✅ | ✅ |
| Quadro dos Sonhos | ✅ | ✅ | ✅ | ✅ |
| Registro de Ideias | ✅ | ✅ | ✅ | ✅ |
| API de Tempo | ✅ | ✅ | ✅ | ✅ |
| Spotify no Pomodoro | ✅ | ✅ | ✅ | ✅ |
| Clientes | ❌ | ❌ | ✅ | ✅ |
| CRM / Leads | ❌ | ❌ | ✅ | ✅ |
| Prospecção | ❌ | ❌ | ✅ | ✅ |
| Assistente de Voz com IA | ❌ | ✅ | ❌ | ✅ |
| Voz por WhatsApp | ❌ | ✅ | ❌ | ✅ |
| IA de análise | ❌ | ✅ | ❌ | ✅ |

**Fora de todos os planos por enquanto:** Campanhas, AI de campanhas, Família & Equipe.

---

## 3. Estratégia de lançamento — 2 fases

### Fase A — Planos Padrão (prioridade máxima)

**O que lança:** Pessoal Padrão (R$29) + Business Padrão (R$99)

**Meta:** o mais rápido possível — velocidade de execução é prioridade.

**O que o usuário recebe na Fase A:**
- App de produtividade completo: tarefas, hábitos, pomodoro, agenda, diário, quadro dos sonhos
- Finanças pessoais (CPF) — Padrão / Finanças completas CPF+CNPJ — Business
- Registro de ideias por voz e texto
- Clima na interface (API de tempo)
- Spotify tocando durante o Pomodoro
- CRM, Leads, Prospecção e Clientes (Business)
- Interface em português, design com identidade Orbita
- Autenticação segura (email + Google OAuth funcional)
- Cadastro com confirmação de email
- Recuperação de senha

### 3.1 Regra de priorização operacional

- O ciclo de execucao foi reiniciado a partir do estado atual.
- Enquanto a Fase A nao estiver fechada, a fila principal segue esta ordem:
  1. onboarding/ajuda minima;
  2. pendencias operacionais de lancamento;
  3. admin/retencao;
  4. marca, LP e auditoria final;
  5. validacao real em producao da Kiwify por ultimo.
- Nova ideia nao entra no fluxo principal por impulso.
- Nova ideia entra primeiro em `docs/IDEIAS_PRODUTO.md`.
- Ideias aprovadas para execucao devem ficar agrupadas no sprint final de expansao do ciclo atual, depois do fechamento da fase principal.

### Fase B — Planos Pro (após Fase A estável)

**O que lança:** Pessoal Pro (R$49) + Business Pro (R$149)

**O que diferencia a Fase B:**

#### Assistente de Voz com IA (no app)
- Não é o VoiceCommandButton atual (que foi removido por não ter IA)
- Será construído do zero com integração real a um LLM (Claude API ou similar)
- Usuário fala → IA entende contexto → executa ação ou responde
- Exemplos: "Cria uma tarefa para amanhã às 9h", "Qual meu saldo esse mês?", "Analisar meus hábitos da semana"

#### Assistente de Voz por WhatsApp
- Integração via WhatsApp Cloud API + n8n como orquestrador de fluxos
- Usuário manda mensagem de voz ou texto para um número da Orbita no WhatsApp
- IA processa, acessa dados do usuário no banco e responde
- Exemplo: "Oi, quanto gastei essa semana?" → resposta com resumo financeiro

#### IA de Análise de Processos
- Análise de padrões de hábitos, produtividade, financeiro
- Insights automáticos: "Você é 40% mais produtivo nas manhãs de terça"
- Sugestões de melhoria baseadas no histórico do usuário

**Stack técnica prevista para Fase B:**
- n8n (self-hosted no mesmo VPS) para orquestração de fluxos
- LLM: Claude API (ou GPT-4) para raciocínio
- WhatsApp Cloud API (Meta) para canal de mensagens
- Custo estimado por usuário Pro: R$5-12/mês (LLM calls + WhatsApp)

---

## 4. Financeiro

### 4.1 Margens por plano

| Plano | Preço | Custo variável | Margem bruta |
|---|---|---|---|
| Pessoal Padrão | R$29 | ~R$1.10 | ~96% |
| Pessoal Pro | R$49 | ~R$7.00 | ~86% |
| Business Padrão | R$99 | ~R$3.50 | ~96% |
| Business Pro | R$149 | ~R$13.00 | ~91% |

*Custo variável inclui: taxa de pagamento (Kiwify, conforme tabela vigente) + LLM para planos Pro + email transacional + storage.*
*Custo fixo mensal: ~R$200 (VPS + ferramentas). Sobe para ~R$400-500 a partir de ~500 assinantes.*

### 4.2 Projeção de lucro

Distribuição estimada: 50% Pessoal Padrão · 25% Pessoal Pro · 15% Business Padrão · 10% Business Pro

| Assinantes | Receita/mês | Custos/mês | **Lucro/mês** |
|---|---|---|---|
| 10 | R$480 | ~R$230 | **~R$250** |
| 100 | R$4.800 | ~R$630 | **~R$4.170** |
| 1.000 | R$48.000 | ~R$5.300 | **~R$42.700** |

---

## 5. Pagamentos

| Item | Decisão |
|---|---|
| **Plataforma** | **Kiwify** |
| **Checkout no lancamento** | Hosted Kiwify |
| **Entrada comercial oficial** | Landing page com 4 planos visiveis |
| **Motivo** | Menor esforco de implementacao para lancar rapido (checkout pronto e operacao concentrada na plataforma) |
| **Taxa** | Conforme tabela vigente no painel/contrato Kiwify |

**Fluxo comercial oficial do lancamento:**
1. Visitante entra na landing page.
2. Escolhe um dos 4 planos na propria LP.
3. Faz cadastro com o plano ja preselecionado.
4. E redirecionado direto ao checkout Kiwify.
5. So depois segue para acesso da plataforma.

**Fluxo de validação de assinatura:**
1. Kiwify dispara webhook (pagamento aprovado / recusado / cancelado / estornado)
2. Server atualiza `users.plan`, `users.planExpiry`, `users.planStatus`
3. Middleware tRPC verifica `planStatus === 'active'` e `planExpiry > Date.now()` antes de liberar features
4. Frontend lê `user.plan` e condiciona a renderização dos módulos por plano

**Campos novos necessários na tabela `users`:**
- `plan`: `"personal_standard" | "personal_pro" | "business_standard" | "business_pro" | null`
- `planExpiry`: timestamp de expiração da assinatura atual
- `planStatus`: `"active" | "expired" | "canceled" | "trial"`

---

## 6. Segurança

### 6.1 Problemas identificados (auditoria pré-lançamento)

| Severidade | Problema | Arquivo | Status |
|---|---|---|---|
| ALTO | Rate limiting ausente no auth (brute force livre) | `server/_core/index.ts` | Pendente Sprint 2 |
| ALTO | Sem security headers | `server/_core/index.ts` | Pendente Sprint 2 |
| ALTO | JWT expiry em 1 ANO | `server/_core/sdk.ts:54` | Pendente Sprint 2 |
| ALTO | Credenciais de clientes em texto puro no banco | `server/routers/credentials.ts` | Pendente Sprint 2 |
| ALTO | Google OAuth quebrado em produção (modo "Testing") | Google Cloud Console | Ação do dono |
| MÉDIO | Tokens OAuth Google Calendar em texto puro | `drizzle/schema.ts` | Deixar para depois |
| ✅ OK | Senhas de usuário hasheadas com bcrypt | — | OK |
| ✅ OK | Cookies httpOnly + HTTPS | — | OK |

### 6.2 O que aplicar antes do lançamento (Sprint 2)

**Rate limiting** (`express-rate-limit`):
- `/api/trpc/auth.login`: 10 requisições / 15 minutos por IP
- `/api/trpc/auth.register`: 5 requisições / hora por IP
- Global: 200 requisições / minuto por IP

**Security headers** (`helmet`):
- 1 linha: `app.use(helmet())` em `server/_core/index.ts`
- Cobre: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.

**JWT expiry:**
- De `ONE_YEAR_MS` para `7 * 24 * 60 * 60 * 1000` (7 dias)
- Usuários precisarão fazer login novamente após o deploy

**Encrypt credenciais de cliente:**
- Nova variável de ambiente: `CREDENTIAL_ENCRYPTION_KEY` (32 bytes hex)
- Usar `crypto` nativo do Node (AES-256-GCM)
- Criptografar `password` ao salvar, descriptografar ao ler

### 6.3 O que deixar para depois do lançamento
- Tokens OAuth (Google Calendar) em texto puro — risco baixo com poucos usuários
- Migração para S3 de arquivos — complexidade alta, não bloqueia
- CSRF tokens completos — cookies httpOnly já mitigam
- Audit logging — pós-lançamento

---

## 7. Design

| Item | Decisão |
|---|---|
| **Cor principal** | Azul com MUITA personalidade — não o azul genérico atual |
| **Identidade** | Evitar "cara de IA/template" — design com personalidade própria |
| **Cards compartilháveis** | Pelo menos 1 card (Dashboard ou Financeiro → exportar para Instagram) |
| **Landing page** | Por ÚLTIMO — só depois da aplicação estar estável |
| **Tema padrão** | Definir qual tema (claro/dark) o usuário vê ao entrar pela primeira vez |
| **Tipografia** | Manter Inter + Space Grotesk |

**O que evitar no redesign:**
- Gradientes azuis genéricos + glass morphism sem identidade
- Copy com "revolucionário", "IA mágica", "transforme sua vida"
- Layout igual a qualquer outro SaaS de produtividade

**O que quer no redesign:**
- Personalidade forte e reconhecível (como Notion, Linear, Figma têm identidade própria)
- Cards de resultado que usuário queira compartilhar espontaneamente
- Sensação de produto premium desde a primeira tela

---

## 8. Features novas definidas (todos os planos)

| Feature | Planos | Observação |
|---|---|---|
| **Registro de ideias** | Todos | Por texto ou gravação de áudio |
| **API de tempo (clima)** | Todos | Opcional — usuário pode ativar |
| **Spotify no Pomodoro** | Todos | Pergunta se quer ouvir ao iniciar sessão |
| **Confirmação de email** | Todos | Obrigatória no cadastro |
| **Recuperação de senha** | Todos | "Esqueci minha senha" no login + troca dentro do app |
| **Personalização de notificações** | Todos | Usuário escolhe quais alertas/popups receber |
| **Tutorial de primeiro acesso** | Todos | Boas-vindas + passo a passo guiado da plataforma |
| **Central de ajuda** | Todos | Documentação de cada funcionalidade dentro do app |

---

## 9. Admin (dashboard do dono)

Uma tela interna (não visível para usuários) para o dono acompanhar:
- Usuários ativos por plano
- Tempo de assinatura contratado
- Tempo para vencimento de cada assinante
- Tempo para próximo pagamento
- Histórico de pagamentos
- Taxa de churn (futuro)

---

## 10. Email marketing

**Fluxo de emails planejado:**
1. **Boas-vindas** — imediato após confirmação de email
2. **Onboarding D+1** — "Você criou sua primeira tarefa?"
3. **Onboarding D+3** — dica de feature específica
4. **Onboarding D+7** — "Como está sua primeira semana?"
5. **Aviso de expiração** — 7 dias antes, 3 dias antes, 1 dia antes
6. **Retenção** — após cancelamento, sequência de reativação

**Ferramenta:** Brevo (300 emails/dia grátis) ou Resend — decidir na Sprint 7.

---

## 11. Ações do dono (não são código)

| # | Ação | Urgência |
|---|---|---|
| A1 | Google Cloud Console → Adicionar URIs de produção (`/api/oauth/google/callback` e `/api/oauth/google/login/callback`) | Alta |
| A2 | Google Cloud Console → Publicar app OAuth (sair do modo "Testing") | Alta |
| A3 | Google Cloud Console → Revogar credenciais atuais + gerar novas | Alta |
| A4 | Servidor (SSH) → Atualizar `.env` com novas credenciais + `CREDENTIAL_ENCRYPTION_KEY` | Alta |
| A5 | Domínio oficial definido: `getorbita.com.br` | Concluida |
| A6 | Configurar Kiwify + webhook URL oficial | Antes de fechar Sprint 4 |

---

## 12. Estratégia de nicho vertical (Fase B+, não prioridade agora)

Após a base estar sólida, criar versões especializadas por público:
- **orbita.adv** — para advogados: gestão de processos, controle de honorários, agenda de audiências
- **orbita.gestores** — para gestores de tráfego: relatórios de campanha, controle de clientes e budgets
- **orbita.clinicas** — para clínicas: agenda de consultas, gestão de pacientes

Cada sub-brand usa o mesmo core do Orbita com personalização de UX, copy e features específicas do nicho.

---

## 13. O que NÃO foi decidido ainda

- Design visual final — apenas a direção foi definida (azul com personalidade)
- Ferramenta de email marketing (Brevo ou Resend — Sprint 7)
- Copy e estrutura da Landing Page (Sprint 9 — por último)
- Stack exata da IA para os planos Pro (Claude API vs OpenAI — Fase B)
- Preço final dos planos (testável após lançamento com A/B pricing)
