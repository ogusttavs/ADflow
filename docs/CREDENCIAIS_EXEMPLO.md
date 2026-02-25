# Credenciais - Modelo Seguro

Atualizado em: 2026-02-25 00:18:33 -0300

Este arquivo e apenas um modelo de organizacao.
Nao colocar credenciais reais no repositorio ou em `docs/`.

## Onde guardar segredos reais
- `.env` local (nao versionado)
- Secret manager do provedor em producao
- Cofre de senhas do time (com controle de acesso)

## Campos comuns (exemplo)

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
CREDENTIAL_ENCRYPTION_KEY=
```

## Regra
- Se algum segredo vazar em chat/docs/commit, rotacionar imediatamente.
