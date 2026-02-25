# Estrategia Integrada: Mercado, UX, Seguranca, Privacidade e Design de Marca

Atualizado em: 2026-02-24
Objetivo: base unica para voce e o Claude decidirem prioridades de execucao com equilibrio entre crescimento, experiencia do usuario, seguranca e reputacao de marca.

## 0) Como usar este documento
- Este documento separa `evidencia` de `decisao`.
- Sempre que houver interpretacao, marcamos como `Inferencia`.
- Ordem recomendada de execucao: P0 (confianca + risco) -> P1 (facilidade + diferenciacao) -> P2 (escala).
- Nao tratar este arquivo como teoria: cada bloco foi escrito para virar backlog executavel.

## 1) O que mudou nesta versao
- Ampliacao de fontes em UX, acessibilidade, performance, experimentacao e design systems.
- Ampliacao forte em AppSec: supply chain, CVSS v4, CWE Top 25, SBOM, Secure by Design.
- Inclusao de privacidade/LGPD com fontes oficiais (Planalto + ANPD).
- Inclusao de governanca de IA e seguranca para produtos com recursos generativos.
- Inclusao de evidencias sobre viralidade/referrals com limites e riscos de incentivo mal desenhado.
- Conversao para formato de decisao: criterios, checklists, riscos e perguntas de debate com Claude.

## 2) Leitura critica do documento anterior (Gemini)

## Pontos fortes
- Direcao correta de PLG e validacao concierge.
- Boa intuicao de viralizacao via referrals e conteudo compartilhavel.
- Linguagem pragmatica de venda inicial sem depender de stack completo.

## Lacunas que precisavam aprofundamento
- Faltava um sistema de qualidade de UX (heuristicas + metricas + acessibilidade + performance).
- Faltava baseline tecnico formal de seguranca (ASVS/SAMM/SSDF/API Security).
- Faltava camada de privacidade/LGPD para operacao real no Brasil.
- Faltava estrategia concreta para "instagramavel" sem cair em visual generico de template.
- Faltava plano de risco com criterios de aceite por release.

## 3) Pesquisa consolidada (evidencias)

## 3.1 UX: fundamentos de usabilidade
- Heuristicas de Nielsen continuam referencia pratica para diagnostico rapido de problemas de interface.
- Progressive Disclosure reduz erro e sobrecarga cognitiva quando o split entre basico/avancado esta correto.
- Information Scent melhora navegacao quando labels antecipam claramente o que vem a seguir.
- User Control and Freedom reforca necessidade de undo/cancel em fluxos com risco de arrependimento.
- `Inferencia`: no seu produto, esses principios impactam direto ativacao, suporte e churn inicial.

## 3.2 Acessibilidade e compreensao de conteudo
- WCAG 2.2 trouxe criterios AA relevantes para SaaS moderno (ex.: target size minimo, focus not obscured, dragging alternatives).
- WAI-ARIA APG continua referencia para padroes de teclado, roles e semantica em componentes complexos.
- W3C orienta linguagem clara e concisa como parte pratica de acessibilidade (nao so "copy bonita").
- `Inferencia`: acessibilidade aqui nao e so compliance; ela reduz erro operacional em tarefas do dia a dia.

## 3.3 Performance percebida
- Limiares classicos de percepcao (0.1s, 1s, 10s) seguem uteis para desenho de feedback.
- Core Web Vitals recomendados para saude do frontend em producao: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 (p75).
- `Inferencia`: em SaaS de rotina diaria, lentidao recorrente pesa tanto quanto bug funcional na percepcao de valor.

## 3.4 Medicao e experimentacao confiavel
- HEART (Google) segue um framework util para ligar UX a objetivos de produto.
- Literatura de experimentacao em escala (Google/Microsoft) reforca que infraestrutura + disciplina metodologica importam tanto quanto "rodar teste".
- `Inferencia`: sem governanca de experimento, o time toma decisoes por ruido (ex.: olhar parcial sem criterio, metricas proxy sem impacto real).

## 3.5 Seguranca de software: baseline moderno
- OWASP Top 10:2025 deve ser o baseline de awareness da aplicacao.
- OWASP ASVS 5.0.0 oferece requisitos verificaveis para nivelar seguranca por release.
- OWASP API Security Top 10:2023 precisa ser tratado separadamente da superficie web tradicional.
- OWASP SAMM ajuda a evoluir maturidade de SDLC seguro de forma incremental.
- NIST SSDF (SP 800-218) formaliza praticas de desenvolvimento seguro no ciclo inteiro.
- CISA Secure by Design reforca principio de transferir carga de seguranca do usuario para o fabricante.
- `Inferencia`: para um SaaS em crescimento, ASVS + API Top10 + SSDF + SAMM e combinacao pragmatica e escalavel.

## 3.6 Vulnerabilidades, priorizacao e supply chain
- CWE Top 25 ajuda a priorizar causas-raiz de fraquezas recorrentes.
- CISA KEV ajuda a priorizar patching por exploracao ativa (risco real, nao teorico).
- CVSS v4.0 aumenta granularidade e melhora priorizacao contextual (Base/Threat/Environmental/Supplemental).
- SBOM (CycloneDX/SPDX), SLSA e Scorecard ajudam a reduzir risco de cadeia de dependencias.
- `Inferencia`: sem inventario de componentes e criterio de patch por KEV, backlog de seguranca vira lista infinita sem foco.

## 3.7 Privacidade e LGPD (Brasil)
- Base legal primaria: Lei 13.709/2018 (LGPD) e Lei 12.965/2014 (Marco Civil).
- ANPD ja possui regulacao operacional relevante, incluindo comunicacao de incidente com dados pessoais.
- Guias da ANPD (agentes de tratamento, encarregado, cookies) sao referencia pratica para adequacao progressiva.
- `Inferencia`: para o seu contexto, compliance minimo eficaz passa por: base legal por fluxo, minimizacao de dados, registro de operacoes, plano de incidente.

## 3.8 IA responsavel e IA segura
- NIST AI RMF 1.0 e GenAI Profile (NIST AI 600-1) oferecem estrutura de risco para recursos com IA generativa.
- OWASP Top 10 for LLM Applications (v1.1) cobre riscos de prompt injection, data leakage, excessive agency etc.
- ISO/IEC 42001 ajuda governanca de AI management system (AIMS) em organizacoes que precisem formalizar maturidade.
- `Inferencia`: se a IA for diferencial comercial, governanca de prompt/output/acao precisa entrar no backlog de produto, nao ficar so em pesquisa.

## 3.9 "Instagramavel" sem "cara de IA"
- Aesthetic-usability effect: estetica aumenta percepcao de qualidade, mas nao corrige friccao grave.
- Estudos de primeira impressao indicam impacto rapido de complexidade/prototipicidade visual.
- Teoria de processing fluency reforca que "facil de processar" tende a ser percebido como mais agradavel.
- Distinctive brand assets (ativos distintivos) sustentam memorabilidade: elementos devem ser unicos e reconheciveis.
- `Inferencia`: "instagramavel" de alto nivel = assinatura visual propria + prova real de resultado + composicao compartilhavel nativa.

## 3.10 Viralidade e referrals (com cautela)
- Evidencia academica mostra que emocao/contexto social influenciam compartilhamento.
- Evidencia tambem mostra risco de incentivo publico mal desenhado em referrals (pode reduzir recomendacao em certos contextos).
- Estudos recentes de replicacao indicam que alguns efeitos classicos de compartilhamento nao sao universais em redes sociais atuais.
- `Inferencia`: referral deve ser testado por segmento e tipo de oferta; recompensa "errada" pode piorar confianca e conversao.

## 4) Decisoes praticas para o produto

## 4.1 Principios de produto (congelar como regra)
1. Clareza primeiro: uma tela, um objetivo principal, um CTA dominante.
2. Confianca acima de brilho: sem "falso salvo", sem acao destrutiva silenciosa.
3. Velocidade percebida: feedback imediato e estados explicitos.
4. Seguranca por padrao: usuario nao pode ser o "controle compensatorio".
5. Marca memoravel: consistencia de identidade em todos os pontos de contato.

## 4.2 Decisoes de UX
1. Reduzir carga cognitiva por fluxo:
- limitar opcoes concorrentes por etapa;
- progressive disclosure para opcoes avancadas;
- linguagem operacional (nao vaga).
2. Proteger usuario em fluxos de risco:
- confirmacao contextual + undo quando viavel;
- estado de erro acionavel (o que fazer agora).
3. Melhorar navegacao e orientacao:
- labels com alto information scent;
- hierarquia visual previsivel;
- padrao unico de feedback (loading/sucesso/erro).
4. Acessibilidade operacional:
- teclado/foco em todos os dialogs;
- areas clicaveis dentro do minimo AA;
- revisao de contraste e leitura.

## 4.3 Decisoes de seguranca
1. Baseline tecnico:
- adotar ASVS 5.0.0 (L1 geral + L2 para fluxos sensiveis);
- checklist API Top10 por endpoint critico.
2. Segredos e credenciais:
- secret manager + rotacao + trilha de auditoria;
- proibicao de secret em docs, codigo e chat de operacao.
3. Vulnerabilidade e patching:
- priorizar CVEs exploradas (KEV) e superficies expostas;
- criterio de SLA por severidade e explorabilidade.
4. Supply chain:
- SBOM por release;
- politica de dependencia com score minimo e assinatura de artefatos quando possivel.
5. Logging e resposta:
- padrao de logs de seguranca sem vazar PII/segredos;
- deteccao de eventos sensiveis e playbook de incidente.

## 4.4 Decisoes de privacidade (LGPD)
1. Mapear tratamento de dados por dominio (clientes, campanhas, financeiro, credenciais, arquivos).
2. Definir base legal e finalidade por fluxo de dados.
3. Aplicar minimizacao e retencao com prazo definido.
4. Instituir processo de resposta a incidente com dados pessoais (ANPD + titulares quando aplicavel).
5. Revisar cookies e trackers com transparencia e controle do titular.

## 4.5 Decisoes de IA
1. Catalogar onde a IA atua: sugestao, decisao, automacao, acao externa.
2. Bloquear "excessive agency" sem controle humano em acoes irreversiveis.
3. Criar filtros de input/output para reduzir injection/leakage.
4. Registrar trilha de prompts, modelos e versoes em operacoes sensiveis.
5. Definir fallback seguro quando IA falhar (nao quebrar fluxo core).

## 4.6 Decisoes de design "instagramavel"
1. Congelar DNA visual:
- paleta primaria exclusiva;
- dupla tipografica com personalidade;
- sistema de forma e iconografia consistente.
2. Criar momentos compartilhaveis nativos:
- cards de resultado (antes/depois, metas, ganhos);
- resumos visuais semanais com identidade de marca;
- export social com formatos verticais priorizados.
3. Evitar aparencia generica de template:
- sem combinacao padrao de gradiente + glass + copy vaga;
- usar dados reais do usuario (com consentimento) para autenticidade;
- motion com funcao de orientacao, nao decoracao gratuita.

## 4.7 Blueprint de LP principal (repaginacao orientada a conversao)
Objetivo da LP:
- Converter visitante frio em cadastro (ou login) com promessa clara, prova real e risco percebido baixo.

Mensagem central recomendada:
- "Organize a operacao de marketing em um unico painel e entregue com consistencia."

Publico alvo primario:
- Freelancer e microagencia que sofrem com operacao fragmentada (planilha + WhatsApp + ferramentas isoladas).

Estrutura recomendada da LP (ordem):
1. Hero (acima da dobra):
- headline de resultado (sem hype generico);
- subheadline com publico + dor + solucao;
- CTA primario unico ("Criar conta gratis");
- microprovas de friccao baixa (sem cartao, setup rapido, transparencia de produto).
2. Secao "Antes vs Depois":
- contraste visual imediato da dor atual x estado desejado;
- linguagem concreta de rotina, prazo e retrabalho.
3. Blocos de valor do produto:
- 3 a 5 pilares reais do produto atual (evitar prometer modulo nao pronto como se fosse completo).
4. Como funciona:
- 3 passos maximos, com progresso claro e linguagem operacional.
5. Confianca:
- separar "o que ja funciona hoje" de "o que esta em evolucao";
- compromisso publico de seguranca/privacidade com referencias (OWASP/NIST/LGPD).
6. FAQ de objecoes:
- para quem e, preco/friccao inicial, nivel de automacao atual, seguranca.
7. CTA final:
- repetir CTA primario + secundaria de exploracao de produto.

Regras de copy para a LP:
- Evitar termos vagos ("revolucionario", "IA magica", "crescimento garantido").
- Usar frases orientadas a tarefa e resultado concreto.
- Tratar incerteza com transparencia ("em evolucao por etapas", "o que ja funciona hoje").
- Uma promessa principal por secao.

Regras de design para evitar "cara de IA":
- usar assinatura visual propria (cor, ritmo, composicao, tipografia);
- evitar "gradiente + glass" como unico elemento de identidade;
- inserir blocos de prova contextual (estado real do produto, sem numeros inventados);
- manter hierarquia visual forte e limpa (escaneavel em 5-8 segundos).

Metricas da LP:
- CTR do CTA primario;
- taxa de cadastro iniciado e concluido;
- scroll depth ate secoes de confianca/FAQ;
- tempo ate acao principal;
- taxa de retorno de visitante nao convertido.

## 4.8 Estrategia n8n (IA + WhatsApp + automacoes)
Decisao de arquitetura:
- manter backend proprio como `source of truth` de dados e regras de negocio;
- usar n8n como camada de orquestracao para eventos externos e automacoes multi-canal;
- evitar regra critica permanente somente no n8n sem trilha no backend.

Quando usar n8n:
- integracao de canais externos (WhatsApp, email, webhooks, CRM externo);
- roteamento de mensagens, classificacao e dispatch de tarefas;
- pipelines de IA com steps encadeados (prompt, validacao, aprovacao, resposta);
- automacoes de rotina (lembrete, follow-up, notificacao, sincronizacao).

Quando nao usar n8n (ou usar com cautela):
- logica de autorizacao/permissao por tenant;
- operacoes financeiras irreversiveis sem dupla validacao;
- fluxo que exige latencia muito baixa e alta previsibilidade transacional.

Modelo recomendado para IA via n8n:
1. Trigger (Webhook/WhatsApp) recebe evento.
2. Sanitizacao e normalizacao de input.
3. Enriquecimento com contexto do AdFlow (cliente, historico, regras).
4. Chamada ao modelo de IA (com limite de escopo e guardrails).
5. Pos-processamento com verificacao de formato e politicas.
6. Persistencia no backend + resposta ao canal.
7. Telemetria: log de execucao, latencia, custo e taxa de erro.

Modelo recomendado para WhatsApp via n8n:
1. Webhook recebe mensagem do WhatsApp Cloud API.
2. Validacao de origem/assinatura + deduplicacao por message id.
3. Classificacao da intencao (briefing, status, aprovacao, suporte).
4. Roteamento:
- briefing -> cria/atualiza campanha no AdFlow;
- status -> consulta dados e responde com resumo;
- aprovacao -> avanca etapa no funil da campanha;
- suporte -> abre tarefa interna e confirma recebimento.
5. Fallback humano quando confianca da IA estiver baixa.

Possibilidades praticas com n8n (priorizadas):
1. Intake de briefing via WhatsApp com criacao automatica de tarefa/campanha.
2. Follow-up automatico de pendencias de aprovacao com janela de horario.
3. Resumo diario para dono/agencia com alertas de risco (prazo, caixa, entrega).
4. Recuperacao de lead frio com sequencia de mensagens contextualizadas.
5. Disparo de lembrete financeiro (vencimento e atraso) com historico no CRM.
6. Pipeline de conteudo: ideia -> rascunho IA -> revisao -> publicacao/manual.
7. Notificacao de eventos criticos (falha de campanha, bloqueio de conta, erro de integracao).
8. Sincronizacao entre AdFlow e ferramentas externas (Sheets, Notion, CRM, email).
9. Reengajamento de cliente inativo baseado em regras de segmentacao.
10. Triagem de suporte com FAQ assistido e escalonamento humano.

Riscos e controles para n8n:
- risco: duplicidade de execucao por retry/webhook;
- controle: idempotency key por evento e lock por recurso.
- risco: vazamento de segredo em workflow/log;
- controle: credenciais gerenciadas, mascaramento de logs e RBAC.
- risco: automacao acionar acao errada em larga escala;
- controle: dry-run, aprovacao humana em etapas sensiveis e feature flags.
- risco: gargalo de throughput em picos;
- controle: queue mode, workers dedicados e monitoracao de fila.

KPIs especificos de n8n:
- taxa de sucesso por workflow;
- latencia p50/p95 por fluxo;
- custo por execucao e por conversa;
- taxa de fallback humano;
- taxa de erro de integracao por canal;
- ganho de tempo operacional por automacao.

## 4.9 Fluxo de Email no App (o que ter e como fazer)
Decisao recomendada:
- sim, usar n8n para orquestracao de email;
- manter backend AdFlow como dono de preferencias, consentimento, segmentacao e trilha de auditoria.

Categorias de email que o app deve ter:
1. Transacional (obrigatorio):
- boas-vindas e primeiro acesso;
- convite de equipe/familia e aceite de convite;
- alerta de seguranca (novo login, mudanca de credencial, erro critico);
- notificacao de eventos importantes (aprovacao/reprovacao de campanha).
2. Operacional (alto impacto):
- resumo diario da operacao (tarefas, agenda, pendencias);
- lembrete de vencimento financeiro e atraso;
- pendencia de aprovacao de campanha com CTA direto.
3. Lifecycle/Growth (com opt-in e limite):
- onboarding D1/D3/D7 para ativacao;
- reengajamento de usuario inativo;
- educacao de features novas baseada no perfil de uso.

Arquitetura recomendada de email:
1. Backend gera evento de dominio (`email.event.created`) com idempotency key.
2. n8n consome evento via webhook/fila e aplica regras de orquestracao.
3. n8n resolve template + variaveis + canal/provedor.
4. Envio por provedor transacional (SMTP/API).
5. Webhooks de entrega/bounce/spam complaint retornam ao backend.
6. Backend atualiza status de entrega e reputacao do contato.

Porque n8n aqui:
- acelera criacao de fluxos sem alterar core code toda hora;
- permite sequencias e janelas de horario sem complexidade excessiva no backend;
- facilita integrar provider de email, CRM e alertas internos no mesmo fluxo.

O que deve ficar no backend (nao no n8n):
- preferencia de notificacao por usuario;
- consentimento, unsubscribe e bloqueio de categorias;
- regras de LGPD e retencao;
- auditoria de quem enviou/o que foi enviado.

Boas praticas obrigatorias de email:
- separar IP/domino por tipo de envio (transacional vs marketing), quando aplicavel;
- autenticar dominio (SPF, DKIM, DMARC) antes de escala;
- implementar List-Unsubscribe para fluxos promocionais;
- limitar frequencia por usuario para evitar fadiga;
- idempotencia para evitar envio duplicado em retry.

Fluxos de email prioritarios para MVP:
1. Boas-vindas apos cadastro + guia de primeira vitoria.
2. Convite de equipe/familia com link seguro e expiracao.
3. Resumo diario de pendencias operacionais.
4. Lembrete de vencimento financeiro (antes + no dia + atraso).
5. Pendencia de aprovacao de campanha com CTA para abrir no app.

KPIs de email no app:
- taxa de entrega (delivery rate);
- bounce rate e complaint rate;
- open rate e CTR por categoria;
- taxa de conversao por fluxo (ex.: email -> aprovacao concluida);
- unsubscribe rate por segmento;
- tempo medio entre trigger e envio.

## 5) Plano de execucao recomendado

## P0 (1-2 semanas) - Confianca, risco e base operacional
- Corrigir todo fluxo que aparenta salvar sem persistir.
- Inserir confirmacao/undo em exclusoes e mudancas criticas.
- Remover segredos expostos e forcar rotacao imediata dos comprometidos.
- Criar checklist minimo de release seguro (ASVS L1 + API checks essenciais).
- Padronizar logs de seguranca e eventos de auditoria.
- Definir procedimento de incidente LGPD (responsavel, prazo, fluxo).

Criterios de aceite P0:
- 0 fluxos de "falso salvo".
- 100% das acoes destrutivas criticas com confirmacao.
- 100% dos segredos em gerenciador central.
- playbook de incidente aprovado e testado em simulacao.

## P1 (2-6 semanas) - Facilidade, consistencia e diferenciacao
- Simplificar navegacao principal e reduzir ruido de itens indisponiveis.
- Implementar tokens de design e estados visuais padrao.
- Instrumentar HEART + funil de ativacao + Core Web Vitals.
- Criar kit de conteudo compartilhavel com assinatura visual.
- Implementar check de acessibilidade em componentes criticos.
- Subir primeiros workflows n8n com guardrails (briefing WhatsApp, follow-up e alertas internos).
- Subir fluxo base de email transacional/operacional com preferencia por usuario e webhooks de entrega.

Criterios de aceite P1:
- reducao mensuravel do tempo para primeira vitoria.
- aumento da conclusao de onboarding.
- reducao de erros em formularios principais.

## P2 (6-12 semanas) - Escala de crescimento e maturidade
- Evoluir referrals com testes controlados por segmento.
- Subir maturidade AppSec (SAMM roadmap + automacao CI/CD).
- Fortalecer supply chain com SBOM assinada e controles de proveniencia.
- Formalizar governanca de IA em modulos de maior impacto.
- Escalar n8n com queue mode + observabilidade completa + playbooks de incidente por workflow.
- Evoluir jornada lifecycle de email com limite de frequencia e segmentacao comportamental.

Criterios de aceite P2:
- cadencia de releases sem regressao de seguranca grave.
- ganho sustentado em retencao e conversao com experimentacao confiavel.

## 6) KPIs recomendados

## UX
- Tempo para primeira vitoria (TTFV operacional do seu produto).
- Taxa de conclusao de onboarding.
- Taxa de erro por fluxo critico.
- Tempo medio de tarefa principal por modulo.

## Negocio
- Ativacao D1, retencao D7 e D30.
- Conversao Free -> Pro.
- Churn por coorte de onboarding.
- Taxa de compartilhamento de cards de resultado.

## Seguranca
- MTTR de vulnerabilidades criticas.
- percentual de segredos fora de codigo e docs.
- cobertura de logs em eventos sensiveis.
- percentual de requisitos ASVS aplicados por release.

## Privacidade
- percentual de fluxos com base legal/finalidade documentadas.
- tempo de resposta a solicitacoes de titulares.
- tempo de deteccao e resposta a incidente com dados pessoais.

## 7) Riscos de implementacao (e mitigacao)
1. Risco: priorizar "visual" e adiar confianca/salvamento real.
- Mitigacao: travar roadmap com gate P0 antes de features de exibicao.
2. Risco: gerar backlog de seguranca impossivel de executar.
- Mitigacao: priorizar por exposicao real (KEV + superficie internet + impacto).
3. Risco: referral com incentivo errado reduzir confianca.
- Mitigacao: testar modelo de recompensa por coorte e manter private rewards quando necessario.
4. Risco: IA automatizar demais sem trilha e sem controle humano.
- Mitigacao: limite de autonomia + auditoria + fallback manual.
5. Risco: design "instagramavel" virar tema cosmetico sem resultado.
- Mitigacao: atrelar design a funis reais (ativacao, compartilhamento, retencao).

## 8) Perguntas para debate com Claude (antes de executar)
1. Qual ICP unico dos proximos 90 dias?
2. Qual fluxo define oficialmente "primeira vitoria"?
3. Quais telas criticas entram no hardening P0 imediatamente?
4. Qual nivel de ASVS adotamos por dominio (L1/L2)?
5. Quais eventos de seguranca precisam de alerta em tempo real?
6. Qual politica formal para segredos e rotacao?
7. Qual trilha minima de compliance LGPD por release?
8. Como vamos medir sucesso do novo onboarding?
9. Qual identidade visual sera congelada como assinatura da marca?
10. Quais ativos distintivos vamos repetir em 100% dos touchpoints?
11. Quais formatos sociais priorizar para cards compartilhaveis?
12. Como evitar incentivo de referral que pareca "venda forcada"?
13. Quais modulos de IA podem agir sem aprovacao humana?
14. Onde a IA deve ser "assistente" e nao "agente"?
15. Quais 3 metricas decidem continuar/parar um experimento?
16. Qual limite de risco para liberar feature sem teste A/B completo?
17. Qual estrategia para reduzir itens "em breve" no menu sem perder narrativa comercial?
18. Qual criterio para descontinuar feature que nao comprova valor?
19. Qual rotina semanal de revisao de risco tecnico + risco de negocio?
20. Quais entregas precisam virar compromisso publico de confianca com usuario?
21. Quais fluxos do WhatsApp vao para automacao total e quais exigem aprovacao humana?
22. Qual limite de autonomia para IA em n8n antes de obrigar fallback humano?
23. Qual SLO minimo por workflow n8n (latencia, sucesso, disponibilidade)?
24. Qual politica de versionamento e rollback de workflows no n8n?
25. Qual modelo de custo por mensagem/execucao para manter margem no plano business?
26. Quais categorias de email serao obrigatorias no MVP (transacional/operacional/lifecycle)?
27. Qual provedor de email vamos adotar primeiro e qual fallback?
28. Qual politica de frequencia maxima por usuario para evitar fadiga?
29. Como sera o modelo de opt-in/opt-out por categoria de email?
30. Qual SLO de entrega para emails criticos (seguranca e financeiro)?

## 9) Checklists curtos para uso no dia a dia

## 9.1 Checklist de release UX
- Fluxo principal tem CTA unico e claro.
- Estados de loading/sucesso/erro consistentes.
- Mensagem de erro orienta recuperacao.
- Acessibilidade basica validada (teclado, foco, contraste, alvo minimo).
- Tempo de resposta dentro de metas de percepcao.

## 9.2 Checklist de release Seguranca
- Segredos fora do repositorio e docs.
- Controles de autorizacao por recurso revisados.
- Logs de eventos sensiveis habilitados sem vazar dado sensivel.
- Dependencias novas avaliadas (risco + licenca + manutencao).
- Procedimento de rollback e incidente atualizado.

## 9.3 Checklist LGPD
- Finalidade e base legal definidas por fluxo novo.
- Coleta minimizada ao necessario.
- Politica de retencao aplicada.
- Transparencia ao titular atualizada onde aplicavel.
- Processo de incidente com dados pessoais operacional.

## 9.4 Checklist Design de Marca
- Token de cor/tipo/espacamento aplicado.
- Componente de assinatura visual presente.
- Conteudo visual com prova real (nao promessa vaga).
- Export social com padrao visual consistente.
- Tela nao parece template generico reutilizado sem identidade.

## 10) Referencias (fontes pesquisadas)

## 10.1 UX, acessibilidade e design systems
- NN/g - 10 Usability Heuristics (2024): https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g - Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g - Information Scent: https://www.nngroup.com/articles/information-scent/
- NN/g - Minimize Cognitive Load: https://www.nngroup.com/articles/minimize-cognitive-load/
- NN/g - User Control and Freedom: https://www.nngroup.com/articles/user-control-and-freedom/
- NN/g - Website Response Times: https://www.nngroup.com/articles/website-response-times/
- NN/g - Error-Message Guidelines: https://www.nngroup.com/articles/error-message-guidelines/
- NN/g - Aesthetic-Usability Effect: https://www.nngroup.com/articles/aesthetic-usability-effect/
- W3C - WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C - ARIA APG: https://www.w3.org/WAI/ARIA/apg/
- W3C - Writing for Web Accessibility: https://www.w3.org/WAI/tips/writing/
- W3C - Design Tokens CG: https://www.w3.org/community/design-tokens/
- W3C - Design Tokens Format Module 2025.10: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- web.dev - Web Vitals: https://web.dev/articles/vitals
- ISO 9241-210:2019 (Human-centred design): https://www.iso.org/standard/77520.html
- Apple HIG (fundamentos): https://developer.apple.com/design/human-interface-guidelines/
- Microsoft Fluent 2 (acessibilidade): https://fluent2.microsoft.design/accessibility

## 10.2 Medicao UX e experimentacao
- Google HEART (CHI 2010):
https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
- HEART paper mirror (PDF):
https://blog.kleros.io/content/files/pub-tools-public-publication-data/pdf/36299.pdf
- Google - Overlapping Experiment Infrastructure (KDD 2010):
https://research.google/pubs/overlapping-experiment-infrastructure-more-better-faster-experimentation/
- Microsoft - Experimentation Platform (trustworthy A/B testing):
https://www.microsoft.com/en-us/research/articles/microsofts-experimentation-platform-how-we-build-a-world-class-product/
- Microsoft - Patterns of Trustworthy Experimentation (post-experiment):
https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/articles/patterns-of-trustworthy-experimentation-post-experiment-stage/

## 10.3 Seguranca de software
- OWASP Top 10:2025: https://owasp.org/Top10/2025/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP ASVS releases (v5.0.0): https://github.com/OWASP/ASVS/releases
- OWASP API Security Top 10:2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP SAMM: https://owasp.org/www-project-samm/
- OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
- OWASP Logging Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP Threat Modeling Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Secrets Management Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- OWASP TLS Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
- NIST SSDF SP 800-218: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST CSF 2.0 hub: https://www.nist.gov/cyberframework
- NIST CSF 2.0 document: https://doi.org/10.6028/NIST.CSWP.29
- NIST SP 800-63B (63-4): https://pages.nist.gov/800-63-4/sp800-63b.html
- NIST SP 800-53 updates (5.2.0 news):
https://csrc.nist.gov/News/2025/nist-releases-revision-to-sp-800-53-controls
- NIST Log Management project (SP 800-92 rev.1 context):
https://csrc.nist.gov/projects/log-management
- CISA Secure by Design:
https://www.cisa.gov/resources-tools/resources/secure-by-design
- CISA Secure by Design portal:
https://www.cisa.gov/securebydesign
- CISA KEV catalog updates:
https://www.cisa.gov/news-events/alerts/2025/06/02/cisa-adds-five-known-exploited-vulnerabilities-catalog
- MITRE CWE Top 25 2024:
https://cwe.mitre.org/top25/archive/2024/2024_top25_list
- CVSS v4.0 (FIRST): https://www.first.org/cvss/v4-0/
- NVD support for CVSS v4.0:
https://nvd.nist.gov/general/news/cvss-v4-0-official-support
- SLSA framework: https://slsa.dev/
- OpenSSF Scorecard: https://openssf.org/projects/scorecard/
- CycloneDX SBOM standard: https://cyclonedx.org/

## 10.4 Privacidade e LGPD
- Lei 13.709/2018 (LGPD - Planalto):
https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Lei 12.965/2014 (Marco Civil - Planalto):
https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- ANPD - comunicacao de incidente de seguranca:
https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis
- ANPD - guia de agentes de tratamento e encarregado:
https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-orientativo-sobre-agentes-de-tratamento-e-encarregado
- ANPD - guia de cookies:
https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais

## 10.5 IA segura e governanca de IA
- NIST AI RMF 1.0:
https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- NIST AI RMF Generative AI Profile (NIST AI 600-1):
https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- NIST AI Resource Center:
https://airc.nist.gov/
- OWASP Top 10 for LLM Applications:
https://owasp.org/www-project-top-10-for-large-language-model-applications/
- ISO/IEC 42001:2023 overview:
https://www.iso.org/standard/42001

## 10.6 Marca, percepcao e viralidade
- First impression (visual complexity/prototypicality):
https://www.sciencedirect.com/science/article/abs/pii/S1071581912001127
- Processing fluency and aesthetic pleasure (2004):
https://pubmed.ncbi.nlm.nih.gov/15582859/
- "What is beautiful is usable" (2000):
https://academic.oup.com/iwc/article/13/2/127/898608
- Distinctive Brand Assets (Ehrenberg-Bass):
https://marketingscience.info/news-and-insights/brands-of-distinction
- Role of visuals in social engagement (PR Review 2022):
https://www.sciencedirect.com/science/article/abs/pii/S0363811122000297
- Nature (2024) sobre efeitos de conteudo no Instagram:
https://www.nature.com/articles/s41599-024-02960-3
- JMR 2012 - What Makes Online Content Viral (DOI):
https://doi.org/10.1509/jmr.10.0353
- Psychol Sci 2011 - Arousal increases social transmission (DOI):
https://doi.org/10.1177/0956797611413294
- Psychol Sci 2024 - Replicacoes do efeito de arousal (DOI):
https://doi.org/10.1177/09567976241257255
- JAMS 2019 - referral rewards e custos nao intencionais (open access):
https://link.springer.com/article/10.1007/s11747-019-00635-z
- J Consumer Psychology 2009 - sales and sincerity em WOM (DOI):
https://doi.org/10.1016/j.jcps.2008.12.007

## 10.7 Conversao de landing page (aquisicao)
- Google Ads Help - About landing page experience:
https://support.google.com/google-ads/answer/2404197?hl=en
- Google Ads Help - About Quality Score:
https://support.google.com/google-ads/answer/6167118?hl=en
- Google Ads Help - Expected CTR:
https://support.google.com/google-ads/answer/2615875?hl=en
- Google Ads Help - Ad relevance:
https://support.google.com/google-ads/answer/6167125?hl=en
- Google Ads Help - Landing page experience status:
https://support.google.com/google-ads/answer/7050591?hl=en
- Think with Google - Mobile page speed benchmarks:
https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/mobile-page-speed-new-industry-benchmarks/

## 10.8 n8n, IA e WhatsApp (orquestracao)
- n8n Docs (visao geral):
https://docs.n8n.io/
- n8n Queue Mode (escala):
https://docs.n8n.io/hosting/scaling/queue-mode/
- n8n Webhook node:
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- n8n OpenAI node:
https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/
- n8n AI Agent node:
https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/
- n8n WhatsApp node:
https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp/
- n8n WhatsApp Trigger node:
https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapptrigger/
- Meta WhatsApp Cloud API (documentacao principal):
https://developers.facebook.com/docs/whatsapp/cloud-api/
- Meta WhatsApp Cloud API Webhooks:
https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/

## 10.9 Email transacional e entregabilidade
- n8n Email Send node:
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/
- n8n IMAP Email node:
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap/
- n8n SMTP node:
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.smtp/
- AWS SES Developer Guide:
https://docs.aws.amazon.com/ses/latest/dg/Welcome.html
- Resend docs:
https://resend.com/docs
- Postmark docs:
https://postmarkapp.com/developer
- SendGrid docs:
https://www.twilio.com/docs/sendgrid
- RFC 8058 (One-Click Unsubscribe):
https://www.rfc-editor.org/rfc/rfc8058
- DMARC.org overview:
https://dmarc.org/overview/
