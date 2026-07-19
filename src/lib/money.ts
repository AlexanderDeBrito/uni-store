/** Formata centavos como moeda brasileira: 8990 → "R$ 89,90". */
export function formatarBRL(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "—"
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

/**
 * Converte entrada do usuário em centavos: "89,90" | "89.90" | "R$ 89,90" → 8990.
 * Retorna null para entrada inválida.
 */
export function parseBRL(valor: string): number | null {
  let limpo = valor.replace(/[R$\s]/g, "")
  if (limpo === "") return null
  if (limpo.includes(",")) {
    // formato pt-BR: pontos são separadores de milhar
    limpo = limpo.replace(/\./g, "").replace(",", ".")
  } else if (/^\d+\.\d{1,2}$/.test(limpo)) {
    // ponto único como decimal ("89.9") — mantém
  } else {
    limpo = limpo.replace(/\./g, "")
  }
  const num = Number(limpo)
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}
