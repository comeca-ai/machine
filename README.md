# machine

Framework para criar **ativos digitais com regra pura** — qualquer produto cujo veredito seja determinístico: dados de entrada + relógio = resultado. Sem IA na regra de negócio.

Roda inteiro no Cloudflare Workers (gratuito até 100k req/dia). Um deploy, todos os seus produtos.

---

## O que é um "ativo"

Um ativo é um produto com:
- **Estados declarados** (ao menos um terminal)
- **Regra pura** (`rule.ts`): sem rede, sem relógio externo, sem modelo de IA
- **Casos de teste** cobrindo todos os estados e motivos
- **Planilha mínima** (critério de morte: o produto se paga?)

O produto `funil` — que já vem aqui — é o meta-ativo: decide se uma nova ideia merece virar produto.

---

## Estrutura

```
machine/
├── packages/
│   ├── core/          # defineProduto(), validarProduto(), tipos
│   └── kits/          # helpers (email, timestamps, pdf)
├── apps/
│   └── runtime/
│       ├── src/       # Worker Cloudflare (Hono): API + auth + vitrine
│       ├── public/    # Assets estáticos (JS, CSS, fontes, marcas)
│       └── migrations/# D1 (SQLite) append-only
├── products/
│   ├── funil/         # Meta-produto: testa se a ideia vive ou morre
│   └── exemplo/       # Template: copie e renomeie para criar um produto
├── scripts/           # CLI: registro, cerca, deploy, Cloudflare
├── tests/             # Cobertura obrigatória de todos os produtos
└── .claude/agents/    # Agentes de IA para o ciclo de criação de produtos
```

---

## Início rápido

### 1. Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [pnpm 10+](https://pnpm.io): `npm i -g pnpm`
- Conta no [Cloudflare](https://cloudflare.com) (plano gratuito)
- `wrangler` autenticado: `npx wrangler login`

### 2. Clone e instale

```bash
git clone https://github.com/comeca-ai/machine.git meu-projeto
cd meu-projeto
pnpm install
```

### 3. Crie os recursos Cloudflare

```bash
# Banco de dados D1
npx wrangler d1 create machine
# → copie o database_id para wrangler.jsonc

# Bucket R2 de evidências (privado)
npx wrangler r2 bucket create machine-provas

# Segredos (nunca no repositório!)
npx wrangler secret put API_TOKEN
npx wrangler secret put SEGREDO_CONTA
```

### 4. Configure `wrangler.jsonc`

- Preencha `database_id` com o ID do D1 criado acima.
- Ajuste `EMAIL_REMETENTE` e `DOMINIOS` para seu domínio.
- Ative `LOGIN_EMAIL: "ligado"` quando o Email Service estiver configurado.

### 5. Suba o banco e teste localmente

```bash
pnpm db:local     # aplica migrations no D1 local
pnpm dev          # Worker local em http://localhost:8787
```

### 6. Rode os testes

```bash
pnpm test         # vitest: cobertura de todos os produtos
pnpm typecheck    # TypeScript
pnpm registro:check  # registro.gerado.ts atualizado?
```

### 7. Deploy

```bash
pnpm publicar     # checa, migra D1 remoto, deploy Worker
```

---

## Criando um produto

```bash
# 1. Copie o template
cp -r products/exemplo products/meu-produto

# 2. Edite os 4 arquivos:
#    rule.ts    → tipos + constantes + função regra pura
#    index.ts   → defineProduto() com estados, motivos, preço
#    casos.ts   → um caso por motivo (CI exige cobertura total)
#    FONTES.md  → fontes legais para cada fato da regra

# 3. Registre o produto
pnpm registro

# 4. Rode os testes
pnpm test
```

Veja `products/funil/` para um exemplo real completo.

---

## Ciclo com agentes de IA (`.claude/agents/`)

O framework inclui 6 agentes Claude que cobrem o ciclo completo de um produto:

| Agente | Função |
|--------|--------|
| `pesquisador` | Garimpagem de dor com evidência pública |
| `concretizador` | Transforma dossiê em ficha (sacada, planilha, critério de morte) |
| `adversario` | Tenta matar a ficha antes de codificar |
| `especificador` | Converte ficha em spec: estados, motivos, entrada |
| `implementador` | Escreve `rule.ts`, `index.ts`, `casos.ts` |
| `revisor` | Revisão cega do produto antes do merge |

Use com [Claude Code](https://claude.ai/code) via `/pesquisador`, `/concretizador`, etc.

---

## Variáveis e segredos

| Variável | Onde definir | Exemplo |
|----------|-------------|---------|
| `DOMINIOS` | `wrangler.jsonc` vars | `{"meudominio.com":"meu-produto"}` |
| `EMAIL_REMETENTE` | `wrangler.jsonc` vars | `"Minha Marca <acesso@meudominio.com>"` |
| `LOGIN_EMAIL` | `wrangler.jsonc` vars | `"ligado"` \| `"desligado"` |
| `TURNSTILE_SITEKEY` | `wrangler.jsonc` vars | (chave pública — ok no config) |
| `API_TOKEN` | `wrangler secret put` | (nunca no repositório) |
| `SEGREDO_CONTA` | `wrangler secret put` | (nunca no repositório) |
| `TURNSTILE_SECRET` | `wrangler secret put` | (nunca no repositório) |

---

## Arquitetura

Veja [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) para a visão completa em 4 camadas.

---

## Licença

MIT. Use, copie, adapte. Atribuição apreciada.
