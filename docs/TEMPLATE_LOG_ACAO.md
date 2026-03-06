# Template - Entrada de Log por Acao (V2)

Copie e cole no final de `docs/LOG_AGENTES.md` para cada acao relevante.

```text
[AAAA-MM-DD HH:mm:ss -0300] [autor:<nome>] [perfil:humano|ia] [acao:<categoria.subcategoria>] [id:LOG-AAAAMMDD-HHMMSS-<slug>]
Contexto:
- ...

Mudancas:
- ...

Arquivos afetados:
- ...

Proximo:
- ...

Evidencias:
- ...
```

## Regras rapidas

- `perfil` deve ser `humano` ou `ia`.
- `id` deve ser unico por entrada.
- Sempre incluir pelo menos um item em cada secao.
- Nao remover entradas antigas (append-only).
