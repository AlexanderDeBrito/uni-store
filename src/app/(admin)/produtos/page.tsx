import { Package, Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { storageConfigurado } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { ProdutosTabs } from "./tabs"
import { ProdutoDialog } from "./produto-dialog"
import { FiltrosCatalogo } from "./filtros-catalogo"
import { CardProduto } from "./card-produto"

export const metadata = { title: "Produtos — UNI STORE" }

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>
}) {
  await requireAuth()
  const { categoria, q } = await searchParams
  const busca = q?.trim()

  const categoriaValida =
    categoria === "VESTUARIO" ||
    categoria === "ACESSORIO" ||
    categoria === "INSTITUCIONAL" ||
    categoria === "ALIMENTO"
      ? categoria
      : undefined

  const [produtos, modelos] = await Promise.all([
    db.produto.findMany({
      where: {
        categoria: categoriaValida,
        ...(busca && {
          nome: { contains: busca, mode: "insensitive" as const },
        }),
      },
      include: {
        modelo: true,
        variacoes: { orderBy: [{ cor: "asc" }, { tamanho: "asc" }] },
      },
      orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    }),
    db.modelo.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Catálogo"
        titulo="Produtos"
        subtitulo="Vitrine por produto — cada card reúne as variações e o estoque"
        acao={
          <ProdutoDialog
            modelos={modelos}
            uploadDisponivel={storageConfigurado()}
            trigger={
              <Button className="rounded-xl">
                <Plus className="size-4" /> Novo produto
              </Button>
            }
          />
        }
      />

      <ProdutosTabs />

      <FiltrosCatalogo resultados={produtos.length} />

      {produtos.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
          <Package className="size-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            {busca || categoriaValida
              ? "Nenhum produto encontrado com esses filtros."
              : "Nenhum produto cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((p) => (
            <CardProduto
              key={p.id}
              produto={{
                id: p.id,
                nome: p.nome,
                categoria: p.categoria,
                descricao: p.descricao,
                precoVenda: p.precoVenda,
                custoReferencia: p.custoReferencia,
                imagemUrl: p.imagemUrl,
                imagemTipo: p.imagemTipo,
                imagemNome: p.imagemNome,
                ativo: p.ativo,
                unidadeMedida: p.unidadeMedida,
                mlPorPorcao: p.mlPorPorcao,
                modeloId: p.modeloId,
                modelo: p.modelo
                  ? {
                      nome: p.modelo.nome,
                      arquivoUrl: p.modelo.arquivoUrl,
                      arquivoTipo: p.modelo.arquivoTipo,
                    }
                  : null,
                variacoes: p.variacoes.map((v) => ({
                  id: v.id,
                  cor: v.cor,
                  tamanho: v.tamanho,
                  estoqueAtual: v.estoqueAtual,
                  estoqueReservado: v.estoqueReservado,
                })),
              }}
              modelos={modelos}
              uploadDisponivel={storageConfigurado()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
