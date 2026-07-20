import Link from "next/link"
import { Boxes, History, PackagePlus, SlidersHorizontal } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { descreverVariacao } from "@/lib/produto"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { FiltrosEstoque } from "./filtros-estoque"
import { EntradaDialog } from "./entrada-dialog"
import { AjusteDialog } from "./ajuste-dialog"

export const metadata = { title: "Estoque — UNI STORE" }

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string; q?: string }>
}) {
  await requireAuth()
  const { produto: produtoId, q } = await searchParams
  const busca = q?.trim()

  const [variacoes, movimentos, produtos] = await Promise.all([
    db.variacao.findMany({
      where: {
        produtoId: produtoId || undefined,
        ...(busca && {
          produto: { nome: { contains: busca, mode: "insensitive" as const } },
        }),
      },
      include: { produto: true },
      orderBy: [{ produto: { nome: "asc" } }, { cor: "asc" }, { tamanho: "asc" }],
    }),
    db.movimentacaoEstoque.groupBy({
      by: ["variacaoId", "tipo"],
      _sum: { quantidade: true },
    }),
    db.produto.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ])

  const somas = new Map<string, { entradas: number; saidas: number }>()
  for (const m of movimentos) {
    const atual = somas.get(m.variacaoId) ?? { entradas: 0, saidas: 0 }
    const qtd = m._sum.quantidade ?? 0
    if (m.tipo === "ENTRADA" || m.tipo === "AJUSTE_ENTRADA") atual.entradas += qtd
    else atual.saidas += qtd
    somas.set(m.variacaoId, atual)
  }

  const lista = variacoes.map((v) => ({
    id: v.id,
    label: `${v.produto.nome} ${descreverVariacao(v)}`,
    estoqueAtual: v.estoqueAtual,
  }))

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Inventário"
        titulo="Estoque"
        subtitulo="Saldo por variação, com entradas de produção e histórico completo"
        acao={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              nativeButton={false}
              render={<Link href="/estoque/movimentacoes" />}
            >
              <History className="size-4" /> Histórico
            </Button>
            <AjusteDialog
              variacoes={lista}
              trigger={
                <Button variant="outline" className="rounded-xl">
                  <SlidersHorizontal className="size-4" /> Ajuste
                </Button>
              }
            />
            <EntradaDialog
              variacoes={lista}
              trigger={
                <Button className="rounded-xl">
                  <PackagePlus className="size-4" /> Registrar entrada
                </Button>
              }
            />
          </div>
        }
      />

      <FiltrosEstoque produtos={produtos} resultados={variacoes.length} />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Produto</th>
                <th className="th-label">Variação</th>
                <th className="th-label hidden text-right sm:table-cell">
                  Entradas
                </th>
                <th className="th-label hidden text-right sm:table-cell">
                  Saídas
                </th>
                <th className="th-label text-right">Reservado</th>
                <th className="th-label pr-6 text-right">Disponível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {variacoes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    Nenhuma variação encontrada. Cadastre produtos para
                    controlar o estoque.
                  </td>
                </tr>
              )}
              {variacoes.map((v) => {
                const s = somas.get(v.id) ?? { entradas: 0, saidas: 0 }
                const disponivel = v.estoqueAtual - v.estoqueReservado
                return (
                  <tr
                    key={v.id}
                    className="transition-colors hover:bg-neutral-50/60"
                  >
                    <td className="px-4 py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Boxes className="size-4 text-neutral-500" />
                        </span>
                        <span className="text-sm font-medium text-neutral-900">
                          {v.produto.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">
                      {descreverVariacao(v)}
                    </td>
                    <td className="hidden px-4 py-4 text-right text-sm text-neutral-400 sm:table-cell">
                      {s.entradas}
                    </td>
                    <td className="hidden px-4 py-4 text-right text-sm text-neutral-400 sm:table-cell">
                      {s.saidas}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-neutral-500">
                      {v.estoqueReservado > 0 ? v.estoqueReservado : "—"}
                    </td>
                    <td
                      className={`px-4 py-4 pr-6 text-right text-sm font-bold ${
                        disponivel <= 0 ? "text-destructive" : "text-neutral-900"
                      }`}
                    >
                      {disponivel}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
