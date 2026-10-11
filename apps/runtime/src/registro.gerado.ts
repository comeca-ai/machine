// ARQUIVO GERADO por scripts/gerar-registro.mjs. Não edite à mão.
import type { Produto } from '@maquina/core'
import p_funil from '../../../products/funil/index'
import p_exemplo from '../../../products/exemplo/index'

export const produtos: Record<string, Produto> = {
  'funil': p_funil as unknown as Produto,
  'exemplo': p_exemplo as unknown as Produto,
}
