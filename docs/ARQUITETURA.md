# Arquitetura — machine

## Visão geral

```
┌─────────────────────────────────────────────────────┐
│                 Cloudflare Workers                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Frontend   │  │     API      │  │  Cron job │  │
│  │  (Assets)   │  │  (Hono)      │  │  17 */h   │  │
│  └─────────────┘  └──────┬───────┘  └─────┬─────┘  │
│                          │                │         │
│            ┌─────────────▼────────────────▼──────┐  │
│            │          registro.gerado.ts          │  │
│            │   (mapa nome → produto)             │  │
│            └─────────────┬────────────────────────┘  │
│                          │                            │
│      ┌───────────────────┼───────────────────┐        │
│      │                   │                   │        │
│  ┌───▼────┐         ┌────▼────┐        ┌─────▼────┐   │
│  │ funil  │         │ exemplo │  ...   │ produto  │   │
│  │rule.ts │         │ rule.ts │        │ rule.ts  │   │
│  └────────┘         └─────────┘        └──────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Bindings                                        │  │
│  │  DB (D1 SQLite) │ PROVAS (R2) │ EMAIL │ CASO_WF │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## As 4 camadas

### 1. FUNIL — Validação da ideia

**Antes de escrever uma linha de código**, toda ideia passa pelo produto `funil`:

- Tem evidência de dor pública?
- A planilha mínima (margem por caso) é positiva?
- A sacada é copiável em uma semana por um concorrente?
- Em 14 dias surgiu ao menos 1 pessoa disposta a pagar?

O funil retorna `viva` ou `morta`. Ideia morta não vira produto.

```
Ideia → pesquisador → concretizador → adversario → funil
                                                    ↓
                                              viva ou morta
```

### 2. CONTRATO — `defineProduto()`

Cada produto declara seu contrato antes de qualquer código de backend:

```typescript
defineProduto({
  nome: 'meu-produto',
  versao: 'v1',
  entrada: z.object({ ... }),      // schema validado em runtime
  estados: {
    pendente: { final: false, prazoDias: 30 },
    aprovado: { final: true },
    rejeitado: { final: true },
  },
  estadoInicial: 'pendente',
  motivos: {
    aguardando:   'pendente',
    criterio_ok:  'aprovado',
    expirado:     'rejeitado',
  },
  regra,                           // função pura
  preco: { ... },
  naoFaremos: [ ... ],
})
```

A plataforma valida o contrato em build time. Falta um estado ou motivo: erro.

### 3. FÁBRICA — `rule.ts` pura

A regra é uma função TypeScript pura:

```typescript
function regra(entrada: MinhaEntrada, ctx: Contexto): Veredito<MeuEstado, MeuMotivo>
```

**Invariantes invioláveis:**
- Sem rede (`fetch`, `axios`)
- Sem relógio (`Date.now()`, `new Date()`) — use `ctx.hoje` injetado
- Sem modelo de IA
- Sem efeitos colaterais
- Sem estado global

O resultado é determinístico: mesma entrada + mesmo `ctx.hoje` = mesmo veredito, sempre.

### 4. CHÃO — Runtime Cloudflare

O Worker processa cada requisição:

```
POST /api/casos/:produto
  → valida entrada (zod)
  → chama regra(entrada, { hoje: new Date().toISOString().slice(0,10) })
  → grava no log append-only (D1)
  → dispara CasoWorkflow se necessário (Workflow)
  → retorna { estado, motivo, caseId }
```

**Bindings disponíveis para efeitos (fora da regra):**

| Binding | Tipo | Uso |
|---------|------|-----|
| `DB` | D1 (SQLite) | Log append-only de todos os casos |
| `PROVAS` | R2 (bucket privado) | Evidências, PDFs, arquivos |
| `EMAIL` | Email Service | Magic link de autenticação |
| `CASO_WF` | Workflow | Execução durável assíncrona |

## Segurança

### Autenticação

Magic link por e-mail (Cloudflare Email Service). Nenhuma senha armazenada.

### Autorização

- `API_TOKEN` (header `Authorization: Bearer ...`) protege rotas de escrita.
- `SEGREDO_CONTA` assina os magic links.
- Acesso público: apenas rotas declaradas em `apps/runtime/src/publico.ts`.

### Dados

- Evidências: bucket R2 **privado** (nunca `wrangler r2 bucket create ... --public`).
- Log D1: append-only. Nenhum `DELETE` ou `UPDATE` nas migrations.
- Segredos: `wrangler secret put`. Nunca no repositório.

## Testes

O arquivo `tests/cobertura.test.ts` varre todos os produtos automaticamente e exige:

1. `contrato válido` — `validarProduto()` retorna `[]`
2. `tem casos.ts` — arquivo existe
3. `tem NAO-FAREMOS.md` — arquivo existe
4. `cada estado e cada motivo tem teste` — `lacunas()` retorna `{ estados: [], motivos: [] }`
5. `todos os casos batem com a regra` — `divergencias()` retorna `[]`

Adicionar um produto sem casos: CI falha. Adicionar um motivo sem caso: CI falha.

## Deploy

```
pnpm registro:check   # registro.gerado.ts sincronizado com products/
pnpm typecheck        # TypeScript sem erros
pnpm test             # Cobertura completa
↓
pnpm publicar         # D1 migrations → wrangler deploy
```

CI/CD: `.github/workflows/ci.yml` (PR) e `.github/workflows/teste.yml` (env teste).
