import Link from "next/link"
import { Boxes, History, PackagePlus, SlidersHorizontal } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { FiltrosSku } from "@/components/filtros-sku"
import { EntradaDialog } from "./entrada-dialog"
import { AjusteDialog } from "./ajuste-dialog"

export const metadata = { title: "Estoque — UNI STORE" }

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; cor?: string; tamanho?: string }>
}) {
  await requireAuth()
  const { modelo, cor, tamanho } = await searchParams

  const [produtos, movimentos, modelos] = await Promise.all([
    db.produto.findMany({
      where: {
        modeloId: modelo || undefined,
        cor: cor ? { contains: cor, mode: "insensitive" } : undefined,
        tamanho: tamanho || undefined,
      },
      include: { modelo: true },
      orderBy: [{ modelo: { nome: "asc" } }, { cor: "asc" }, { tamanho: "asc" }],
    }),
    db.movimentacaoEstoque.groupBy({
      by: ["produtoId", "tipo"],
      _sum: { quantidade: true },
    }),
    db.modelo.findMany({ orderBy: { nome: "asc" } }),
  ])

  const somas = new Map<string, { entradas: number; saidas: number }>()
  for (const m of movimentos) {
    const atual = somas.get(m.produtoId) ?? { entradas: 0, saidas: 0 }
    const qtd = m._sum.quantidade ?? 0
    if (m.tipo === "ENTRADA" || m.tipo === "AJUSTE_ENTRADA") {
      atual.entradas += qtd
    } else {
      atual.saidas += qtd
    }
    somas.set(m.produtoId, atual)
  }

  const listaProdutos = produtos.map((p) => ({
    id: p.id,
    label: `${p.modelo.nome} ${p.cor} — ${p.tamanho}`,
    estoqueAtual: p.estoqueAtual,
  }))

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Inventário"
        titulo="Estoque"
        subtitulo="Saldo por SKU, com entradas de produção e histórico completo"
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
              produtos={listaProdutos}
              trigger={
                <Button variant="outline" className="rounded-xl">
                  <SlidersHorizontal className="size-4" /> Ajuste
                </Button>
              }
            />
            <EntradaDialog
              produtos={listaProdutos}
              trigger={
                <Button className="rounded-xl">
                  <PackagePlus className="size-4" /> Registrar entrada
                </Button>
              }
            />
          </div>
        }
      />

      <FiltrosSku modelos={modelos} resultados={produtos.length} />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Produto</th>
                <th className="th-label hidden text-right sm:table-cell">
                  Entradas
                </th>
                <th className="th-label hidden text-right sm:table-cell">
                  Saídas
                </th>
                <th className="th-label text-right">Saldo atual</th>
                <th className="th-label pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    Nenhum produto encontrado. Cadastre produtos para controlar
                    o estoque.
                  </td>
                </tr>
              )}
              {produtos.map((p) => {
                const s = somas.get(p.id) ?? { entradas: 0, saidas: 0 }
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-neutral-50/60"
                  >
                    <td className="px-4 py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Boxes className="size-4 text-neutral-500" />
                        </span>
                        <span className="text-sm font-medium text-neutral-900">
                          {p.modelo.nome} {p.cor} — {p.tamanho}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-right text-sm text-neutral-400 sm:table-cell">
                      {s.entradas}
                    </td>
                    <td className="hidden px-4 py-4 text-right text-sm text-neutral-400 sm:table-cell">
                      {s.saidas}
                    </td>
                    <td
                      className={`px-4 py-4 text-right text-sm font-bold ${
                        p.estoqueAtual === 0
                          ? "text-destructive"
                          : "text-neutral-900"
                      }`}
                    >
                      {p.estoqueAtual}
                    </td>
                    <td className="px-4 py-4 pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link href={`/estoque/movimentacoes?produto=${p.id}`} />
                        }
                      >
                        Histórico
                      </Button>
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
