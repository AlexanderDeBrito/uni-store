import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { FiltrosSku } from "@/components/filtros-sku"
import { ProdutosTabs } from "./tabs"
import { ProdutoDialog } from "./produto-dialog"
import { ExcluirProdutoButton } from "./excluir-produto"
import { ModeloPreview } from "./modelo-preview"

export const metadata = { title: "Produtos — UNI STORE" }

/** Pílula de estoque: neutra quando há saldo, destacada quando acaba. */
function PilulaEstoque({ quantidade }: { quantidade: number }) {
  const estilo =
    quantidade === 0
      ? "bg-destructive/10 text-destructive"
      : quantidade <= 5
        ? "bg-neutral-900 text-white"
        : "bg-neutral-100 text-neutral-700"
  return (
    <span
      className={`inline-flex min-w-9 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}
    >
      {quantidade}
    </span>
  )
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; cor?: string; tamanho?: string }>
}) {
  await requireAuth()
  const { modelo, cor, tamanho } = await searchParams

  const [produtos, modelos] = await Promise.all([
    db.produto.findMany({
      where: {
        modeloId: modelo || undefined,
        cor: cor ? { contains: cor, mode: "insensitive" } : undefined,
        tamanho: tamanho || undefined,
      },
      include: { modelo: true },
      orderBy: [{ modelo: { nome: "asc" } }, { cor: "asc" }, { tamanho: "asc" }],
    }),
    db.modelo.findMany({ orderBy: { nome: "asc" } }),
  ])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Catálogo"
        titulo="Produtos"
        subtitulo="Cada combinação de modelo + cor + tamanho é uma SKU única"
        acao={
          <ProdutoDialog
            modelos={modelos}
            trigger={
              <Button className="rounded-xl" disabled={modelos.length === 0}>
                <Plus className="size-4" /> Novo produto
              </Button>
            }
          />
        }
      />

      <ProdutosTabs />

      <FiltrosSku modelos={modelos} resultados={produtos.length} />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Modelo</th>
                <th className="th-label">Cor</th>
                <th className="th-label">Tam.</th>
                <th className="th-label text-right">Preço</th>
                <th className="th-label hidden text-right sm:table-cell">
                  Custo ref.
                </th>
                <th className="th-label text-center">Estoque</th>
                <th className="th-label pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    {modelos.length === 0
                      ? "Cadastre um modelo na aba Modelos antes de criar produtos."
                      : "Nenhum produto encontrado."}
                  </td>
                </tr>
              )}
              {produtos.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-neutral-50/60">
                  <td className="px-4 py-4 pl-6">
                    <ModeloPreview modelo={p.modelo} />
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">{p.cor}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                      {p.tamanho}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-neutral-900">
                    {formatarBRL(p.precoVenda)}
                  </td>
                  <td className="hidden px-4 py-4 text-right text-sm text-neutral-400 sm:table-cell">
                    {formatarBRL(p.custoReferencia)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <PilulaEstoque quantidade={p.estoqueAtual} />
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <ProdutoDialog
                        modelos={modelos}
                        produto={p}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
                      <ExcluirProdutoButton
                        produtoId={p.id}
                        descricao={`${p.modelo.nome} ${p.cor} — ${p.tamanho}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
