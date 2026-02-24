# Centro de Operacao - AdFlow

Atualizado em: 2026-02-24 20:30:05 -0300

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
- Lider ativo deve revisar `docs/IDEIAS_PRODUTO.md` em cada ciclo de trabalho.
- Toda acao relevante deve ser registrada no `docs/LOG_AGENTES.md` (implementacao, decisao, commit, push, migracao e release).

Fluxo recomendado:
1. Voce define 1 tarefa com resultado objetivo.
2. Claude prioriza e distribui para Codex/Gemini (ou implementa ele mesmo).
3. Tarefas simples vao primeiro para o Gemini; Codex cobre quando necessario.
4. Claude revisa (bugs/regressao/testes), valida integracao e consolida status.
5. Claude se reporta para voce com decisao/recomendacao.
6. Agente responsavel atualiza "Log de Execucao" com data/hora do sistema.

Fluxo para ideias do dono:
1. Lider ativo revisa `docs/IDEIAS_PRODUTO.md`.
2. Lider ativo vem conversar com voce antes de executar a ideia.
3. Depois da conversa:
- Se implementado: marcar item como `Concluida`.
- Se inviavel: marcar item como `Nao viavel` com motivo.
4. Opcional: mover itens finalizados para o historico do proprio arquivo.

Regra de commit no GitHub:
- Sempre que o lider ativo achar que deve commitar, ele precisa te avisar antes.
- Apos commit/push, o lider informa hash curto e resumo do que foi enviado.
- Se faltar registro de alguma acao, o lider faz registro retroativo imediato com horario real do evento.

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
| Claude | Chefe tecnico, triagem, revisao final e reporte ao dono | Indisponivel (Claude -) |
| Codex | Dev auxiliar senior: implementacao + validacao + lider interino na ausencia do Claude | Lider interino ativo |
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
- `./scripts/install-hooks.sh` (instala hook de pre-commit para exigir update dos docs obrigatorios)

Status tecnico atual:
- `pnpm dev`: OK (subindo em `http://localhost:3001/` quando `3000` esta ocupada)
- `pnpm check`: sem retorno conclusivo no ambiente atual (processo ficou pendente em execucoes longas)
- `pnpm test`: sem retorno conclusivo no ambiente atual (processo ficou pendente em execucoes longas)
- `pnpm build`: sem retorno conclusivo no ambiente atual (processo ficou pendente em execucoes longas)

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
- IA via n8n: usar pipelines com sanitizacao, contexto do cliente, validacao de saida e fallback humano.
- WhatsApp via n8n: webhook -> deduplicacao -> classificacao de intencao -> acao no AdFlow -> resposta ao cliente.
- Email via n8n: orquestracao de fluxos transacionais/operacionais; backend controla consentimento, preferencia e auditoria.
- Possibilidades com n8n (business): follow-up automatico, alertas de prazo/financeiro, resumo diario e reengajamento de cliente.
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

[2026-02-24 14:09:56 -0300] [Codex]
Feito:
- Fluxo do lider ativo atualizado para revisar ideias em `docs/IDEIAS_PRODUTO.md` e conversar com voce antes de executar.
- Regra formal adicionada para fechar ideias como `Concluida` ou `Nao viavel`.
- Politica de commit adicionada: lider avisa antes de commitar/push no GitHub e reporta hash depois.

Fazendo:
- Documentacao sincronizada com o novo fluxo de ideias e commits.

Proximo:
- Aplicar esse processo em toda nova ideia que entrar no backlog.

Bloqueios/Riscos:
- Nenhum.

[2026-02-24 14:21:34 -0300] [Codex]
Feito:
- MVP de Google Agenda implementado (OAuth callback, persistencia de tokens, listagem de eventos e sincronizacao por dia).
- Tela `Agenda` atualizada com conexao Google, eventos proximos e acao de sincronizar tarefas.
- Ideia "Google Login para a plataforma" adicionada no backlog de produto.

Fazendo:
- Fluxo pronto para evoluir para login social com Google na autenticacao principal.

Proximo:
- Implementar fase 2 de auth com `Entrar com Google`.

Bloqueios/Riscos:
- Necessario configurar credenciais Google OAuth e aplicar migracao de banco para nova tabela.

[2026-02-24 14:25:06 -0300] [Codex]
Feito:
- Registro retroativo adicionado para o primeiro ciclo de versionamento Git/GitHub.
- Regra reforcada: toda acao relevante deve ser documentada no log (inclusive commit/push).

Fazendo:
- Ajuste de governanca para eliminar lacunas de historico.

Proximo:
- Continuar registrando cada acao tecnica no momento em que acontecer.

Bloqueios/Riscos:
- Nenhum.

[2026-02-24 14:28:18 -0300] [Codex]
Feito:
- Migracao de banco executada com sucesso (`pnpm db:push`).
- Tabela `google_calendar_connections` criada localmente para suportar integracao real com Google Agenda.

Fazendo:
- Ambiente pronto para conectar conta Google apos configurar credenciais OAuth no `.env`.

Proximo:
- Validar conexao pela tela Agenda com credenciais reais do Google Cloud.

Bloqueios/Riscos:
- Depende de configuracao OAuth no Google Cloud (fora do codigo).

[2026-02-24 14:35:23 -0300] [Codex]
Feito:
- Documento de acoes manuais criado para execucao posterior (`docs/ACOES_MANUAIS_GOOGLE.md`).
- Fluxo de Login Google implementado no backend (rotas de inicio/callback OAuth + criacao/vinculo de conta + sessao).
- Tela de Login atualizada com botao "Entrar com Google" e tratamento de status de erro.

Fazendo:
- Base pronta para validar login social com credenciais reais do Google Cloud.

Proximo:
- Teste end-to-end do login Google com `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.

Bloqueios/Riscos:
- Dependencia externa de configuracao OAuth no Google Cloud.

[2026-02-24 16:06:16 -0300] [Codex]
Feito:
- Comando `Claude +` recebido e processado.
- Handoff consolidado do periodo de contingencia recente (fechamento da etapa Google OAuth, rotacao de secret e sincronizacao de documentacao).
- Registro confirmado de commits/push realizados no periodo:
- `0b1d2b7` (`feat: finalizar etapa Google OAuth e checklist`)
- `582ff75` (`docs: registrar rotacao da secret Google`)

Fazendo:
- Lideranca tecnica devolvida ao Claude conforme governanca oficial.

Proximo:
- Claude retoma triagem, priorizacao e distribuicao de tarefas.
- Codex segue como dev auxiliar senior para execucao tecnica sob direcionamento do Claude.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto no momento.

[2026-02-24 16:30:09 -0300] [Codex]
Feito:
- Revisao critica do documento de estrategia de mercado legado.
- Pesquisa adicional consolidada sobre UX, acessibilidade, seguranca de software e diferenciacao visual de produto.
- Documento estrategico renomeado e reescrito para discussao com Claude: .

Fazendo:
- Pronto para detalhar backlog executavel (P0/P1/P2) em tarefas tecnicas quando aprovado pelo dono.

Proximo:
- Validar prioridades com Claude e iniciar execucao do bloco P0.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto para a proxima etapa.
[2026-02-24 16:30:16 -0300] [Codex]
Feito:
- Revisao critica do documento de estrategia de mercado legado.
- Pesquisa adicional consolidada sobre UX, acessibilidade, seguranca de software e diferenciacao visual de produto.
- Documento estrategico renomeado e reescrito para discussao com Claude: docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md.

Fazendo:
- Pronto para detalhar backlog executavel (P0/P1/P2) em tarefas tecnicas quando aprovado pelo dono.

Proximo:
- Validar prioridades com Claude e iniciar execucao do bloco P0.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto para a proxima etapa.

[2026-02-24 16:30:34 -0300] [Codex]
Feito:
- Nota de integridade adicionada: entrada anterior em 2026-02-24 16:30:09 -0300 teve truncamento por expansao de shell.
- Entrada correta subsequente em 2026-02-24 16:30:16 -0300 contem os caminhos completos.
- Historico mantido sem alteracao retroativa.

Fazendo:
- Fluxo de documentacao normalizado com append protegido.

Proximo:
- Seguir governanca de log sem novas lacunas.

Bloqueios/Riscos:
- Nenhum.

[2026-02-24 16:44:10 -0300] [Codex]
Feito:
- Documento estrategico ampliado com pesquisa adicional e novas fontes: docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md.
- Escopo agora cobre UX, acessibilidade, performance, AppSec, supply chain, privacidade/LGPD, IA segura e diferenciacao visual com base em evidencia.
- Estrutura atualizada para execucao: decisoes praticas, checklists, criterios de aceite, KPIs e perguntas de debate com Claude.

Fazendo:
- Pronto para transformar em backlog tecnico priorizado quando aprovado pelo dono.

Proximo:
- Priorizar bloco P0 e quebrar em tasks por sprint.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto.

[2026-02-24 16:49:28 -0300] [Codex]
Feito:
- Repaginacao da LP principal executada no frontend com foco em conversao e transparencia de produto (Home.tsx).
- Metadados da pagina principal atualizados para aquisicao e compartilhamento (client/index.html).
- Documento estrategico atualizado com blueprint da LP + referencias adicionais de conversion optimization.
- Validacao tecnica: pnpm check OK.

Fazendo:
- Pronto para detalhar proxima fase de CRO com eventos e testes por secao da LP.

Proximo:
- Priorizar instrumentacao de eventos do funil da LP apos validacao visual do dono.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto.

[2026-02-24 16:53:10 -0300] [Codex]
Feito:
- Conversa sobre IA via n8n e WhatsApp via n8n adicionada na documentacao estrategica e operacional.
- Secao de estrategia recebeu blueprint de arquitetura, fluxos recomendados, riscos/controles e KPIs para n8n.
- Secao de ideias recebeu novos itens em conversa para priorizacao posterior.

Fazendo:
- Pronto para transformar os blocos n8n em plano tecnico executavel por sprint.

Proximo:
- Definir com o dono quais 2 workflows entram primeiro no MVP (ex.: briefing WhatsApp e follow-up).

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto.

[2026-02-24 16:55:03 -0300] [Codex]
Feito:
- Fluxo de Email no App incorporado na estrategia (transacional + operacional + lifecycle).
- Modelo de implementacao definido: backend como source of truth + n8n para orquestracao e entrega.
- Backlog de ideias atualizado com item especifico de email.

Fazendo:
- Pronto para detalhar arquitetura tecnica do MVP de email por sprint.

Proximo:
- Definir provedor inicial de email e ordem dos 5 fluxos prioritarios.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto.

[2026-02-24 16:55:57 -0300] [Codex]
Feito:
- Comando operacional `Claude -` recebido.
- Modo contingencia ativado conforme governanca.
- Estado dos agentes atualizado: Claude indisponivel; Codex lider interino ativo.

Fazendo:
- Codex assume triagem e execucao tecnica ate novo comando de retorno (`Claude +`).

Proximo:
- Seguir backlog prioritario e registrar todas as decisoes de contingencia no `docs/LOG_AGENTES.md`.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico aberto neste momento.

[2026-02-24 20:15:21 -0300] [Codex]
Feito:
- Correcao ampla de acessibilidade de formularios executada em paginas ativas (labels com `htmlFor`, campos com `id`/`name`, ajustes de `fieldset/legend` e `aria-label` quando necessario).
- Coletor de debug Manus passou a ser opt-in por env var (`ENABLE_MANUS_DEBUG_COLLECTOR=1`); default desativado em dev.
- Commit e push realizados em `main`: `c4173c0` (`fix(a11y): normalize form labels/ids and gate debug collector`).
- App iniciado localmente para validacao manual e disponibilidade imediata no link `http://localhost:3001/`.
- Instrucoes operacionais completas para subida em VPS entregues ao dono (Node + PM2 + Nginx + MySQL + dominio/SSL).

Fazendo:
- Suporte de deploy para disponibilizar link publico na VPS do dono.

Proximo:
- Executar deploy guiado na VPS e confirmar URL publica final (dominio ou IP com SSL).

Bloqueios/Riscos:
- Sem acesso SSH da VPS neste momento; deploy publico depende da execucao dos comandos no servidor do dono.

[2026-02-24 20:19:17 -0300] [Codex]
Feito:
- Guardrail anti-esquecimento implementado: hook de pre-commit bloqueia commit com mudancas fora de `docs` se `docs/LOG_AGENTES.md` e `docs/CENTRO_DE_OPERACAO.md` nao estiverem staged.
- Scripts adicionados para padronizar o comportamento em qualquer clone local (`scripts/check-docs-sync.sh` e `scripts/install-hooks.sh`).
- Hook ativado no repositorio atual via `git config core.hooksPath .githooks`.

Fazendo:
- Mantendo registro continuo nos docs a cada ciclo de trabalho.

Proximo:
- Ao iniciar trabalho em nova maquina/clone, rodar `./scripts/install-hooks.sh`.

Bloqueios/Riscos:
- O hook age no pre-commit local; em outro clone ele precisa ser instalado uma vez.

[2026-02-24 20:22:15 -0300] [Codex]
Feito:
- Politica elevada para qualquer IA do projeto com tres camadas:
- `AGENTS.md` no repo com regra obrigatoria de update de docs em toda alteracao relevante.
- Hook local reforcado com `pre-commit` + `pre-push` em `.githooks/`.
- Validacao server-side no GitHub Actions (`.github/workflows/docs-guardrail.yml`).
- Script `scripts/check-docs-sync.sh` evoluido para validar por staged (local) e por range (CI/pre-push).

Fazendo:
- Mantendo os registros finais em docs em todo fechamento de ciclo.

Proximo:
- Commitar e subir esta politica para tornar o guardrail efetivo para todos os agentes que atuarem no repositorio remoto.

Bloqueios/Riscos:
- Em clones novos, hooks locais exigem `./scripts/install-hooks.sh` (CI cobre mesmo sem setup local).

[2026-02-24 20:30:05 -0300] [Codex]
Feito:
- Kit de deploy para VPS criado no repositorio:
- `scripts/vps/setup-ubuntu.sh` (setup inicial da VPS: pacotes, Node, pnpm, PM2, MySQL, firewall).
- `scripts/vps/deploy-app.sh` (deploy recorrente: pull, install, build, migrate opcional, restart PM2).
- `scripts/vps/configure-nginx.sh` (proxy publico HTTP no dominio).
- `scripts/vps/enable-ssl.sh` (HTTPS com Certbot).
- `scripts/vps/quick-deploy.sh` (deploy remoto em 1 comando via SSH).
- Guia operacional completo publicado em `docs/DEPLOY_VPS.md`.

Fazendo:
- Preparado para executar publicacao em dominio na VPS do dono.

Proximo:
- Receber IP/usuario SSH e dominio para executar os scripts e validar URL publica final.

Bloqueios/Riscos:
- Publicacao final depende de acesso SSH e DNS apontado para o IP da VPS.
