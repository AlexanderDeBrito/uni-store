import type { Prisma } from "@prisma/client"

type Tx = Prisma.TransactionClient

/**
 * Custo unitário para cálculo de lucro (regra 7.1 do PRD):
 * custo médio ponderado das entradas com custo; na ausência,
 * custo de referência do produto; sem ambos, null ("não calculado").
 */
export async function custoUnitarioVariacao(
  tx: Tx,
  variacaoId: string
): Promise<number | null> {
  const entradas = await tx.movimentacaoEstoque.findMany({
    where: {
      variacaoId,
      tipo: { in: ["ENTRADA", "AJUSTE_ENTRADA"] },
      custoUnitario: { not: null },
    },
    select: { quantidade: true, custoUnitario: true },
  })

  const totalQtd = entradas.reduce((acc, e) => acc + e.quantidade, 0)
  if (totalQtd > 0) {
    const totalCusto = entradas.reduce(
      (acc, e) => acc + e.quantidade * (e.custoUnitario as number),
      0
    )
    return Math.round(totalCusto / totalQtd)
  }

  const variacao = await tx.variacao.findUnique({
    where: { id: variacaoId },
    select: { produto: { select: { custoReferencia: true } } },
  })
  return variacao?.produto.custoReferencia ?? null
}
