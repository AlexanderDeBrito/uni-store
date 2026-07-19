import Link from "next/link"
import { History, PackagePlus, SlidersHorizontal } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
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

  const [produtos, movimentos] = await Promise.all([
    db.produto.findMany({
      where: {
        modelo: modelo
          ? { contains: modelo, mode: "insensitive" }
          : undefined,
        cor: cor ? { contains: cor, mode: "insensitive" } : undefined,
        tamanho: tamanho || undefined,
      },
      orderBy: [{ modelo: "asc" }, { cor: "asc" }, { tamanho: "asc" }],
    }),
    db.movimentacaoEstoque.groupBy({
      by: ["produtoId", "tipo"],
      _sum: { quantidade: true },
    }),
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
    label: `${p.modelo} ${p.cor} — ${p.tamanho}`,
    estoqueAtual: p.estoqueAtual,
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Estoque
          </h1>
          <p className="text-sm text-muted-foreground">
            Saldo por SKU, com entradas de produção e histórico
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href="/estoque/movimentacoes" />}
          >
            <History className="size-4" /> Histórico
          </Button>
          <AjusteDialog
            produtos={listaProdutos}
            trigger={
              <Button variant="outline">
                <SlidersHorizontal className="size-4" /> Ajuste manual
              </Button>
            }
          />
          <EntradaDialog
            produtos={listaProdutos}
            trigger={
              <Button>
                <PackagePlus className="size-4" /> Registrar entrada
              </Button>
            }
          />
        </div>
      </div>

      <FiltrosSku />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Entradas
                </TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Saídas
                </TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum produto encontrado. Cadastre produtos para
                    controlar o estoque.
                  </TableCell>
                </TableRow>
              )}
              {produtos.map((p) => {
                const s = somas.get(p.id) ?? { entradas: 0, saidas: 0 }
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.modelo} {p.cor} — {p.tamanho}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                      {s.entradas}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                      {s.saidas}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        p.estoqueAtual === 0 ? "text-destructive" : ""
                      }`}
                    >
                      {p.estoqueAtual}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={
                          <Link
                            href={`/estoque/movimentacoes?produto=${p.id}`}
                          />
                        }
                      >
                        Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
