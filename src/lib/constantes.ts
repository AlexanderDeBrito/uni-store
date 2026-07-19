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
  return (
    FORMAS_PAGAMENTO.find((f) => f.value === value)?.label ?? value
  )
}
