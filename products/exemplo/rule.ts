/**
 * TEMPLATE — copie esta pasta, renomeie e adapte.
 *
 * Regra pura: sem rede, sem relógio, sem IA.
 * O contexto (ctx.hoje) é injetado de fora pela plataforma.
 *
 * Invariante: cada ramo retorna {estado, motivo} onde motivo ∈ estados[estado].
 */
import type { Contexto, Veredito } from '@maquina/core'
import { diasEntre } from '@maquina/core'

// ── Tipos ──────────────────────────────────────────────────────────────────

/** Estados possíveis do ativo. Deve ter ao menos um final (final: true). */
export type EstadoExemplo = 'pendente' | 'aprovado' | 'rejeitado'

/** Um motivo por transição. Cada motivo ↔ exatamente um estado. */
export type MotivoExemplo =
  | 'aguardando'       // pendente
  | 'criterio_ok'      // aprovado
  | 'prazo_expirado'   // rejeitado
  | 'invalido'         // rejeitado

/** Campos de entrada que a regra recebe. Use tipos primitivos apenas. */
export interface EntradaExemplo {
  /** Data de início (AAAA-MM-DD). */
  inicio: string
  /** Pontuação alcançada (0–100). */
  pontuacao: number
  /** O pedido tem todos os campos obrigatórios? */
  completo: boolean
}

// ── Constantes ──────────────────────────────────────────────────────────────

export const PRAZO_DIAS = 30
export const PONTUACAO_MINIMA = 70

// ── Regra ───────────────────────────────────────────────────────────────────

/**
 * Ordem importa: verificações estruturais (inválido) antes do relógio.
 * A plataforma injeta `ctx.hoje` como string AAAA-MM-DD.
 */
export function regra(c: EntradaExemplo, ctx: Contexto): Veredito<EstadoExemplo, MotivoExemplo> {
  // 1. Rejeição estrutural: não importa o prazo.
  if (!c.completo) return { estado: 'rejeitado', motivo: 'invalido' }

  // 2. Critério atingido: aprova imediatamente.
  if (c.pontuacao >= PONTUACAO_MINIMA) return { estado: 'aprovado', motivo: 'criterio_ok' }

  // 3. Relógio: ainda dentro do prazo?
  const decorridos = diasEntre(c.inicio, ctx.hoje)
  if (decorridos < PRAZO_DIAS) return { estado: 'pendente', motivo: 'aguardando' }

  // 4. Prazo vencido sem critério.
  return { estado: 'rejeitado', motivo: 'prazo_expirado' }
}
