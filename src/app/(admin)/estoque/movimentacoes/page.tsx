import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
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
import { FiltroProduto } from "./filtro-produto"

export const metadata = {
  title: "Histórico de movimentação — UNI STORE",
}

const LABEL_TIPO: Record<string, { label: string; entrada: boolean }> = {
  ENTRADA: { label: "Entrada", entrada: true },
  AJUSTE_ENTRADA: { label: "Ajuste (+)", entrada: true },
  SAIDA: { label: "Saída", entrada: false },
  AJUSTE_SAIDA: { label: "Ajuste (−)", entrada: false },
}

const LABEL_ORIGEM: Record<string, string> = {
  PRODUCAO: "Produção",
  VENDA: "Venda",
  EDICAO_VENDA: "Edição de venda",
  EXCLUSAO_VENDA: "Exclusão de venda",
  AJUSTE_MANUAL: "Ajuste manual",
}

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>
}) {
  await requireAuth()
  const { produto: produtoId } = await searchParams

  const [produtos, movimentacoes] = await Promise.all([
    db.produto.findMany({
      orderBy: [{ modelo: "asc" }, { cor: "asc" }, { tamanho: "asc" }],
      select: { id: true, modelo: true, cor: true, tamanho: true },
    }),
    db.movimentacaoEstoque.findMany({
      where: produtoId ? { produtoId } : undefined,
      include: {
        produto: { select: { modelo: true, cor: true, tamanho: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight lg:text-3xl">
            Histórico de movimentação
          </h1>
          <p className="text-sm text-muted-foreground">
            Últimas 200 movimentações de estoque
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/estoque" />}>
          <ArrowLeft className="size-4" /> Voltar ao estoque
        </Button>
      </div>

      <FiltroProduto
        produtos={produtos.map((p) => ({
          id: p.id,
          label: `${p.modelo} ${p.cor} — ${p.tamanho}`,
        }))}
        produtoSelecionado={produtoId ?? ""}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Origem</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Custo unit.
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Observação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma movimentação registrada.
                  </TableCell>
                </TableRow>
              )}
              {movimentacoes.map((m) => {
                const tipo = LABEL_TIPO[m.tipo]
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {m.data.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.produto.modelo} {m.produto.cor} — {m.produto.tamanho}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tipo.entrada ? "secondary" : "outline"}>
                        {tipo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {LABEL_ORIGEM[m.origem] ?? m.origem}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tipo.entrada ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tipo.entrada ? "+" : "−"}
                      {m.quantidade}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                      {formatarBRL(m.custoUnitario)}
                    </TableCell>
                    <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell">
                      {m.observacao ?? "—"}
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
