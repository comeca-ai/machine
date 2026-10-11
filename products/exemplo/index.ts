/**
 * TEMPLATE — copie esta pasta, renomeie e adapte.
 *
 * `defineProduto()` declara o contrato completo antes de qualquer código de backend.
 * A plataforma valida o contrato em build time.
 */
import { z } from 'zod'
import { defineProduto } from '@maquina/core'
import { regra, PRAZO_DIAS, PONTUACAO_MINIMA, type EntradaExemplo, type EstadoExemplo, type MotivoExemplo } from './rule'

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use AAAA-MM-DD')

export const exemplo = defineProduto<EstadoExemplo, MotivoExemplo, EntradaExemplo>({
  nome: 'exemplo',
  versao: 'v1',

  // ── Entrada ───────────────────────────────────────────────────────────────
  entrada: z.object({
    inicio: data,
    pontuacao: z.number().int().min(0).max(100),
    completo: z.boolean(),
  }),

  // ── Estados ───────────────────────────────────────────────────────────────
  // `final: false` exige prazoDias. `final: true` é estado terminal.
  estados: {
    pendente:   { final: false, prazoDias: PRAZO_DIAS },
    aprovado:   { final: true },
    rejeitado:  { final: true },
  },
  estadoInicial: 'pendente',

  // ── Motivos ───────────────────────────────────────────────────────────────
  // Cada motivo aponta para exatamente um estado.
  motivos: {
    aguardando:      'pendente',
    criterio_ok:     'aprovado',
    prazo_expirado:  'rejeitado',
    invalido:        'rejeitado',
  },

  // ── Regra ─────────────────────────────────────────────────────────────────
  regra,

  // ── Critério de morte automático (opcional) ────────────────────────────────
  // Remove este bloco se não houver critério numérico de morte por prazo.
  criterioDeMorte: {
    prazoDias: PRAZO_DIAS,
    metrica: 'pontuacao',
    minimo: PONTUACAO_MINIMA,
  },

  // ── Preço ────────────────────────────────────────────────────────────────
  // modelo: 'interno' = uso interno gratuito
  // modelo: 'assinatura' = valor mensal fixo (custoPorCasoCentavos = 0)
  // modelo: 'por_caso'  = cobrança por caso aberto
  preco: {
    modelo: 'interno',
    gratis: 'Template de demonstração — substitua pela descrição real do produto.',
    custoPorCasoCentavos: 0,
  },

  // ── Não faremos ───────────────────────────────────────────────────────────
  // Liste aqui o que este produto NUNCA fará. Serve de cerca para o time.
  naoFaremos: [
    'Não usa IA na regra: o veredito é determinístico.',
    'Não estende prazo automaticamente.',
    'Substitua este array pelas restrições reais do seu produto.',
  ],
})

export default exemplo
