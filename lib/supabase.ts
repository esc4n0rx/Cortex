import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type EstoqueData = {
  material: number
  cen?: string
  dep?: string
  t?: string
  lote?: string
  e?: string
  estoque_especial?: string
  texto_breve_material?: string
  tp?: string
  pos_deposito?: string
  estoque_disponivel?: number
  umb?: string
  data_em?: string
}

export type DemandaData = {
  n_deposito?: string
  numero_nt?: number
  status?: string
  tp_transporte?: string
  prio_transporte?: number
  usuario?: string
  dt_criacao?: string
  hr_criacao?: string
  tp_movimento?: number
  tp_deposito?: string
  posicao?: string
  dt_planejada?: string
  ref_transporte?: string
  item_nt?: number
  item_finalizado?: string
  material?: number
  centro?: string
  quant_nt?: number
  unidade?: string
  numero_ot?: number
  quant_ot?: number
  deposito?: string
  desc_material?: string
  setor?: string
  palete?: number
  palete_origem?: number
  endereco?: string
  ot?: number
  pedido?: string
  remessa?: number
  nome_usuario?: string
  dt_producao?: string
  hr_registro?: string
  data_processamento?: string
}

export type CadastroItemData = {
  id?: number
  material: number
  descricao: string
  um: string
  qtd_por_caixa: number
  contador: number
  data_upload?: string
  status?: string
}