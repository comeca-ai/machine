/**
 * TEMPLATE — copie junto com o produto.
 *
 * Regra: um caso por motivo. Se um motivo não aparece aqui, o CI falha.
 * O teste central é tests/cobertura.test.ts — não edite lá, edite aqui.
 */
import type { CasoDeTeste } from '@maquina/core'

/** Entrada base reutilizada em vários casos. */
const base = {
  inicio: '2026-01-01',
  pontuacao: 50,
  completo: true,
}

export const casos: CasoDeTeste[] = [
  {
    nome: 'dentro do prazo, pontuação insuficiente',
    entrada: base,
    ctx: { hoje: '2026-01-10' },
    espera: { estado: 'pendente', motivo: 'aguardando' },
  },
  {
    nome: 'pontuação suficiente aprova imediatamente',
    entrada: { ...base, pontuacao: 80 },
    ctx: { hoje: '2026-01-05' },
    espera: { estado: 'aprovado', motivo: 'criterio_ok' },
  },
  {
    nome: 'prazo vencido sem critério',
    entrada: base,
    ctx: { hoje: '2026-02-10' },
    espera: { estado: 'rejeitado', motivo: 'prazo_expirado' },
  },
  {
    nome: 'entrada incompleta rejeita antes do prazo',
    entrada: { ...base, completo: false },
    ctx: { hoje: '2026-01-05' },
    espera: { estado: 'rejeitado', motivo: 'invalido' },
  },
]
