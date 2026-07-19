import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FiltrosSku } from "@/components/filtros-sku"
import { ProdutoDialog } from "./produto-dialog"
import { ExcluirProdutoButton } from "./excluir-produto"

export const metadata = { title: "Produtos — UNI STORE" }

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; cor?: string; tamanho?: string }>
}) {
  await requireAuth()
  const { modelo, cor, tamanho } = await searchParams

  const produtos = await db.produto.findMany({
    where: {
      modelo: modelo
        ? { contains: modelo, mode: "insensitive" }
        : undefined,
      cor: cor ? { contains: cor, mode: "insensitive" } : undefined,
      tamanho: tamanho || undefined,
    },
    orderBy: [{ modelo: "asc" }, { cor: "asc" }, { tamanho: "asc" }],
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight lg:text-3xl">
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground">
            Cada combinação de modelo + cor + tamanho é uma SKU única
          </p>
        </div>
        <ProdutoDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Novo produto
            </Button>
          }
        />
      </div>

      <FiltrosSku />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Tam.</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Custo ref.
                </TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
              {produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.modelo}</TableCell>
                  <TableCell>{p.cor}</TableCell>
                  <TableCell>{p.tamanho}</TableCell>
                  <TableCell className="text-right">
                    {formatarBRL(p.precoVenda)}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {formatarBRL(p.custoReferencia)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {p.estoqueAtual}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ProdutoDialog
                        produto={p}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
                      <ExcluirProdutoButton
                        produtoId={p.id}
                        descricao={`${p.modelo} ${p.cor} — ${p.tamanho}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
