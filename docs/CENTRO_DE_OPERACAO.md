# Centro de Operacao - AdFlow

Atualizado em: 2026-02-24 13:46:39 -0300

Este arquivo e o ponto unico de sincronizacao entre voce, Codex, Claude e Gemini.
Hierarquia oficial:
- Claude = Chefe tecnico de todos os agentes.
- Codex = dev auxiliar senior.
- Gemini = dev auxiliar de apoio.
- Claude se reporta diretamente para voce (decisao final).
- Claude define o que cada IA vai fazer e, se quiser, implementa diretamente.
- Tarefas simples devem ser priorizadas para o Gemini (otimizacao de custo).
- Se Claude estiver indisponivel, Codex assume lideranca interina e toma as decisoes tecnicas.
- Nessa contingencia, Gemini segue o direcionamento do Codex.
- Se qualquer IA ficar indisponivel, o proximo da cadeia assume as tarefas simples e urgentes.

## 1) Como usar com 3 agentes

Regra de ouro:
- Um agente implementa por vez.
- Um agente revisa por vez.
- Todo mundo atualiza este arquivo no final da tarefa.
- Toda atualizacao deve incluir data/hora atual do sistema.

Fluxo recomendado:
1. Voce define 1 tarefa com resultado objetivo.
2. Claude prioriza e distribui para Codex/Gemini (ou implementa ele mesmo).
3. Tarefas simples vao primeiro para o Gemini; Codex cobre quando necessario.
4. Claude revisa (bugs/regressao/testes), valida integracao e consolida status.
5. Claude se reporta para voce com decisao/recomendacao.
6. Agente responsavel atualiza "Log de Execucao" com data/hora do sistema.

Modo contingencia:
1. Comando do dono: `Claude -` (Claude indisponivel).
2. Codex vira lider interino, define prioridades e distribui tarefas para Gemini.
3. Codex documenta todas as decisoes e execucoes no `docs/LOG_AGENTES.md`.
4. Comando do dono: `Claude +` (Claude disponivel).
5. Codex prepara handoff completo (resumo do periodo + pendencias + proximos passos) e devolve a lideranca ao Claude.

Comandos de disponibilidade:
- `Claude +`: Claude disponivel e no comando.
- `Claude -`: Claude indisponivel; Codex assume lideranca interina.
- `Codex +`: Codex disponivel para execucao e fallback de lideranca.
- `Codex -`: Codex indisponivel; tarefas simples sobem para Gemini/Claude conforme disponibilidade.
- `Gemini +`: Gemini disponivel; tarefas simples voltam para ele (prioridade de custo).
- `Gemini -`: Gemini indisponivel; tarefas simples sobem para Codex e depois Claude.

Regra de fallback em cadeia:
1. Lideranca tecnica: Claude -> Codex -> Gemini (apenas simples/urgente se necessario).
2. Tarefas simples: Gemini -> Codex -> Claude.
3. Se apenas Gemini estiver ativo, ele executa simples/urgente e registra pendencias complexas para retorno do lider.

Template de update:

```text
[AAAA-MM-DD HH:mm:ss -03] [Agente]
Feito:
- ...

Fazendo:
- ...

Proximo:
- ...

Bloqueios/Riscos:
- ...
```

Comando padrao para timestamp:
- `date '+%Y-%m-%d %H:%M:%S %z'`

## 2) Quadro atual dos agentes

| Agente | Papel principal | Estado atual |
|---|---|---|
| Claude | Chefe tecnico, triagem, revisao final e reporte ao dono | Lider ativo |
| Codex | Dev auxiliar senior: implementacao + validacao + lider interino na ausencia do Claude | Ativo |
| Gemini | Dev auxiliar: tarefas simples, apoio de implementacao e pesquisa tecnica | Ativo |

## 3) Snapshot tecnico do projeto

Stack:
- Frontend: React 19 + Vite + Tailwind + Radix + React Query + wouter
- Backend: Node + Express + tRPC + Zod
- Banco: MySQL + Drizzle ORM
- Testes: Vitest

Comandos principais:
- `pnpm dev`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `pnpm db:push`

Status tecnico atual:
- `pnpm check`: OK
- `pnpm test`: OK (41/41)

## 4) Arquitetura resumida

Frontend:
- `client/src/App.tsx`: rotas principais
- `client/src/components/AppLayout.tsx`: shell, sidebar, tags "Em breve", popup diario, responsividade
- `client/src/contexts/ThemeContext.tsx`: temas `light`, `dark`, `dark-blue`, `all-black`, `iron-man`
- `client/src/pages/*`: modulos funcionais

Backend:
- `server/_core/index.ts`: bootstrap Express + tRPC + Vite/static
- `server/routers.ts`: composicao dos routers
- `server/routers/*.ts`: modulos de dominio
- `server/db.ts`: conexao Drizzle/MySQL

Banco:
- `drizzle/schema.ts`: tabelas de usuarios, clientes, campanhas, crm, produtividade, financeiro, arquivos, credenciais, intake, etc.

## 5) O que ja esta feito (resumo funcional)

Base:
- Autenticacao por email/senha (`auth.login`, `auth.register`, `auth.logout`, cookie JWT).
- Layout completo com sidebar, customizacao de menu, notificacoes e comando de voz.
- Temas: claro, escuro, dark blue, all black, iron man.

Clientes:
- CRUD de clientes.
- Configuracao de cliente para IA (tom de voz, publico, identidade visual, canais).
- Tag visual de pagamento atrasado no detalhe do cliente.

Campanhas/IA:
- Criacao/listagem/detalhe de campanha.
- Geracao de estrategia e copias por IA.
- Geracao de criativo por IA.
- Status e aprovacao de copia.

CRM:
- Pipeline, leads, atividades, stats.
- Geracao de leads ideais por IA.

Produtividade pessoal:
- Rotina com tarefas, habitos e pomodoro.
- Agenda integrada de tarefas/habitos.
- Daily briefing e morning popup.
- Comando de voz com fallback de transcricao.
- Diario e quadro dos sonhos.

Financeiro:
- CPF e CNPJ separados.
- Lancamentos (receitas/despesas).
- Recorrencias (receita/despesa recorrente com dia do mes e encerramento opcional).
- Categorias customizadas.
- Comprovantes (upload/list/download) para CPF/CNPJ.
- Resumos mensais e ultimos 3 meses.

Cobranca de cliente:
- Backend de cobranca implementado (`client_billing`, `client_payment_records`).
- Marcar pagamento como pago/atrasado.
- Morning popup mostra vencimentos do dia e permite marcar status.

Cliente (inside):
- Upload de criativos.
- Upload de documentos.
- Credenciais (login/senha) por cliente.
- Formulario publico por link/token (intake) com resposta do cliente.

## 6) O que esta parcial / em desenvolvimento

Itens com tag "Em breve" e bloqueados no menu:
- `Referrals`
- `Performance`
- `Testes A/B`
- `Relatorios`
- `Orcamento`
- `UTM Builder`
- `WhatsApp Bot`
- `Integracoes`

Pontos tecnicos parciais:
- Integracoes externas reais (Meta/Google/TikTok/LinkedIn) ainda nao conectadas de ponta a ponta.
- WhatsApp em modo simulado no app; producao depende aprovacao Meta Business API.
- Cobranca tem backend pronto, mas ainda sem tela dedicada completa para gerenciar regras de cobranca mensal.
- Compartilhamento familiar/equipe existe no backend, mas sem tela de operacao no frontend.

## 7) Achados da revisao de codigo (prioridade)

Alta prioridade:
1. Credenciais de cliente estao armazenadas em texto no banco (`client_credentials.password`).
2. Arquivos/comprovantes estao em base64 no MySQL (`file_attachments.base64Content`), com risco de crescimento e custo.

Media prioridade:
1. `aiCommand.navigate` aponta `utm` para `/utm-builder`, mas rota real e `/utm`.
2. Onboarding navega com `window.location.hash = step.path`; com wouter em modo path isso pode falhar.
3. Pagamentos do mes (`generateMonthPayments`) nao estao sendo disparados pelo frontend automaticamente.
4. `.env.example` sugere S3, mas o fluxo atual de storage usa credenciais Forge.
5. Integracoes salva "API key" so em estado local da tela (nao persiste em backend seguro).

Baixa prioridade:
1. Pasta atual nao esta inicializada como repositiorio Git (sem `.git` local).

## 8) Ideias da nossa conversa (produto e negocio)

Produto:
- Plano pessoal barato (`R$49,90`) sem stack business pesada.
- Versao business com IA + automacoes + WhatsApp.
- Integracao hibrida com n8n para orquestracao.
- Futuro app iPhone (caminho mais rapido: empacotar web com Capacitor).

Operacao:
- Modelo hibrido recomendado: backend proprio para regras/dados + n8n para fluxos.
- Meta Ads / Google Ads via app e possivel, mas exige OAuth, permissoes e manutencao de API.

IA/Agentes:
- Fluxo recomendado: Gemini/Perplexity para pesquisa -> Codex implementa -> Claude audita.

## 9) Estimativas discutidas (base 2026-02-24)

Custos operacionais para 10 clientes (estimativa):
- Baixo: ~R$335,43/mes
- Medio: ~R$497,04/mes
- Alto: ~R$1.025,93/mes

Plano Pessoal Lite `R$49,90`:
- 10 clientes: lucro operacional estimado ~R$378,45/mes
- 100 clientes: lucro operacional estimado ~R$4.375,44/mes

Modelo de monetizacao recomendado:
1. Setup inicial (implantacao)
2. Mensalidade por plano
3. Excedente por uso (WhatsApp/IA) no plano business

## 10) Roadmap recomendado (ordem pragmatica)

Fase 1 (estabilidade):
- Corrigir itens de media prioridade (rotas, onboarding, geracao de pagamentos).
- Definir padrao unico de logs e erros.

Fase 2 (seguranca e escala):
- Criptografar credenciais de cliente.
- Migrar anexos/base64 para object storage (S3/R2/minio) com links assinados.

Fase 3 (produto):
- Finalizar UI de cobranca e compartilhamento familiar/equipe.
- Subir integracoes reais (Meta/Google/WhatsApp prod) com feature flags.

Fase 4 (expansao):
- Plano Pessoal Lite publico.
- App iPhone (Capacitor + TestFlight + App Store).

## 11) Log de execucao

[2026-02-24 13:35:01 -03] [Codex]
Feito:
- Revisao geral do codigo (frontend, backend, banco, testes, temas, financeiro, cliente, voz, IA, integracoes).
- Documento mestre criado com status tecnico e roadmap.
- Hierarquia atualizada: Claude como chefe tecnico; Codex/Gemini como devs auxiliares.
- Regra de timestamp obrigatorio adicionada.

Fazendo:
- Pronto para manter atualizacoes com data/hora real do sistema.

Proximo:
- Criar arquivo dedicado de historico continuo (`docs/LOG_AGENTES.md`).

Bloqueios/Riscos:
- Definir prioridade entre "seguranca" vs "features novas" para proxima sprint.

[2026-02-24 13:38:12 -0300] [Codex]
Feito:
- Ajuste de nomenclatura de agente auxiliar para Gemini no modelo de operacao.
- Regra explicita adicionada: Claude define atribuicoes entre IAs e pode implementar diretamente.

Fazendo:
- Documentacao sincronizada com a governanca atual.

Proximo:
- Manter os proximos updates seguindo essa estrutura de papeis.

Bloqueios/Riscos:
- Nenhum bloqueio para este ajuste de governanca.

[2026-02-24 13:40:29 -0300] [Codex]
Feito:
- Regra de contingencia adicionada: na ausencia do Claude, Codex assume lideranca sobre o Gemini.
- Gatilhos operacionais documentados: "Claude nao ta disponivel" e "Claude voltou".
- Processo de handoff para retorno do Claude documentado.

Fazendo:
- Governanca sincronizada com o modelo atual solicitado.

Proximo:
- Aplicar o modo contingencia sempre que voce ativar por comando.

Bloqueios/Riscos:
- Nenhum.

[2026-02-24 13:46:39 -0300] [Codex]
Feito:
- Comandos novos adicionados: `Codex +`, `Codex -`, `Gemini +`, `Gemini -`.
- Regras de fallback formalizadas para disponibilidade de cada IA.
- Padrao operacional ajustado para comandos curtos `Claude +` e `Claude -`.

Fazendo:
- Documentacao sincronizada com os novos comandos de disponibilidade.

Proximo:
- Executar dinamicamente a cadeia de fallback conforme os comandos que voce enviar.

Bloqueios/Riscos:
- Nenhum.
