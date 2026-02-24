# Marketing Automation SaaS - TODO

## Fase 1: Banco de Dados e Schema
- [x] Criar tabela clients (clientes da agência)
- [x] Criar tabela client_configs (dados pré-definidos: tom de voz, público-alvo, produtos)
- [x] Criar tabela campaigns (campanhas criadas)
- [x] Criar tabela campaign_copies (cópias geradas por canal)
- [x] Criar tabela campaign_creatives (criativos visuais gerados)
- [x] Criar tabela social_accounts (contas de redes sociais conectadas)
- [x] Criar tabela scheduled_posts (posts agendados)
- [x] Criar tabela whatsapp_sessions (sessões do chatbot)
- [x] Criar tabela notifications (notificações do sistema)
- [x] Aplicar migrations no banco

## Fase 2: Layout e Autenticação
- [x] Configurar AppLayout com sidebar colapsável
- [x] Criar navegação com todas as seções
- [x] Configurar tema visual profissional dark
- [x] Página de landing page / login
- [x] Controle de acesso por role (admin/user)

## Fase 3: Configuração de Clientes
- [x] Listagem de clientes
- [x] Formulário de criação/edição de cliente
- [x] Configuração de dados pré-definidos (tom de voz, público-alvo)
- [x] Gestão de produtos/serviços do cliente
- [x] Histórico de campanhas por cliente

## Fase 4: Dashboard e Campanhas
- [x] Dashboard com métricas gerais
- [x] Listagem de campanhas com filtros
- [x] Detalhe de campanha (estratégia, cópias, criativos)
- [x] Histórico e status de publicações
- [x] Gráficos de desempenho (Recharts)

## Fase 5: Motor de IA
- [x] Endpoint de geração de estratégia de campanha (LLM integrado)
- [x] Endpoint de geração de cópias por canal (Instagram, Facebook, TikTok, LinkedIn)
- [x] Endpoint de geração de criativos com generateImage
- [x] Fluxo completo de criação de campanha via IA
- [x] Interface de revisão e edição de conteúdo gerado

## Fase 6: WhatsApp Chatbot
- [x] Webhook para receber mensagens do WhatsApp
- [x] Fluxo de conversa para solicitar campanha via IA
- [x] Simulador de chat para testes
- [x] Configuração de WhatsApp Business API (instruções)
- [x] Sessões de conversa armazenadas no banco

## Fase 7: Freepik API
- [x] Integração com Freepik API para busca de assets (com chave configurável)
- [x] Geração de criativos com IA (generateImage built-in)
- [x] Armazenamento de criativos no banco
- [x] Galeria de criativos por campanha

## Fase 8: Publicação em Redes Sociais
- [x] Conexão de contas de redes sociais (Instagram, Facebook, TikTok, LinkedIn)
- [x] Sistema de agendamento de posts
- [x] Simulação de publicação (real requer OAuth tokens das plataformas)
- [x] Painel de calendário de publicações

## Fase 9: Notificações
- [x] Notificação ao proprietário sobre nova solicitação
- [x] Notificação de campanha gerada
- [x] Notificação de publicação realizada/falha
- [x] Centro de notificações na interface

## Fase 10: Testes e Entrega
- [x] Testes unitários dos routers principais (6 testes passando)
- [x] Checkpoint final
- [x] Documentação de uso (README)

## Fase 11: CRM Completo para Gestor de Tráfego
- [x] Tabela de leads no banco de dados
- [x] Tabela de pipeline/funil de vendas
- [x] Tabela de atividades/interações com leads
- [x] Página CRM com funil visual (Kanban)
- [x] Formulário de criação/edição de lead
- [x] Detalhe do lead com histórico de interações
- [x] Geração de lista de leads ideal por IA (ICP matching)
- [x] Importação/exportação de leads (CSV)
- [x] Filtros e busca avançada de leads

## Fase 12: Testes A/B
- [x] Tabela de testes A/B no banco
- [x] Geração automática de variantes A e B por IA
- [x] Página de gestão de testes A/B
- [x] Comparação visual de variantes com métricas

## Fase 13: Relatórios Automáticos com IA
- [x] Tabela de relatórios no banco
- [x] Geração automática de relatórios de performance
- [x] Insights e recomendações geradas por IA
- [x] Página de relatórios com visualizações

## Fase 14: UTMs Automáticos
- [x] Gerador de UTMs integrado nas campanhas
- [x] Template de UTMs por canal/plataforma
- [x] Rastreamento de UTMs nas métricas

## Fase 15: Dashboard ROAS/CPA/CTR
- [x] Dashboard avançado de performance por canal
- [x] Métricas de ROAS, CPA, CTR, CPM por plataforma
- [x] Gráficos comparativos entre canais

## Fase 16: Alertas Preditivos com IA
- [x] Sistema de alertas baseado em análise de IA
- [x] Detecção de queda de performance
- [x] Sugestões automáticas de ação corretiva

## Fase 17: Otimização Orçamentária com IA
- [x] Análise de distribuição de budget por canal
- [x] Sugestões de redistribuição baseadas em performance
- [x] Simulador de cenários de investimento

## Fase 18: Onboarding Guiado
- [x] Tour interativo para novos usuários
- [x] Templates prontos de campanhas
- [x] Checklist de configuração inicial

## Fase 19: Programa de Indicação
- [x] Sistema de referral com códigos únicos
- [x] Tracking de indicações e conversões
- [x] Página de programa de indicação

## Fase 20: Testes Expandidos
- [x] Testes unitários para novos routers (25 testes passando)
- [x] Navegação atualizada com seções organizadas
- [x] Onboarding integrado no Dashboard

## Fase 21: Comandos de Voz (Voice Commands)
- [x] Botão de microfone no header/navbar
- [x] Gravação de áudio com MediaRecorder API
- [x] Upload e transcrição com Whisper (transcribeAudio)
- [x] Fallback com Web Speech API
- [x] Integração com WhatsApp simulateMessage
- [x] Comandos de voz processados pelo LLM

## Fase 22: Módulo de Produtividade Pessoal
- [x] Tabelas: habits, habit_logs, pomodoro_sessions, daily_tasks
- [x] Pomodoro Timer com sessões configuráveis
- [x] Sistema de hábitos diários recorrentes por dia da semana
- [x] Tasks pontuais com data, prioridade, status, categoria
- [x] Daily Briefing ao abrir o app
- [x] Dashboard de métricas pessoais (streaks, pomodoros, etc.)
- [x] Página "Minha Rotina" na sidebar

## Fase 23: AI Function Calling (Comandos Inteligentes)
- [x] Implementar tool/function calling no LLM
- [x] Funções: addTask, addClient, createCampaign, navigate, startPomodoro, searchLeads
- [x] Interpretar comandos em linguagem natural
- [x] Integração com Voice Commands e Command Bar

## Bugs
- [x] Fix: "Transcription service request failed" ao usar comando de voz - melhorar error handling e fallback
