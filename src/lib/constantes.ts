export const TAMANHOS = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "XG",
  "XXG",
  "Único",
] as const

export const FORMAS_PAGAMENTO = [
  { value: "CARTAO", label: "Cartão" },
  { value: "PIX", label: "Pix" },
  { value: "DINHEIRO", label: "Dinheiro" },
] as const

export function labelFormaPagamento(value: string): string {
  return FORMAS_PAGAMENTO.find((f) => f.value === value)?.label ?? value
}

export const STATUS_EVENTO = {
  PLANEJADO: "Planejado",
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
} as const

export const STATUS_RESERVA = {
  RESERVADA: "Reservada",
  RETIRADA: "Retirada",
  CANCELADA: "Cancelada",
} as const

export const STATUS_PEDIDO = {
  ENCOMENDADO: "Encomendado",
  RECEBIDO_PARCIAL: "Recebido parcial",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
} as const

/** Um pedido está atrasado se passou da previsão e ainda não foi totalmente recebido. */
export function pedidoAtrasado(pedido: {
  status: string
  dataPrevisaoEntrega: Date
}): boolean {
  if (pedido.status === "RECEBIDO" || pedido.status === "CANCELADO") return false
  return pedido.dataPrevisaoEntrega < new Date()
}
