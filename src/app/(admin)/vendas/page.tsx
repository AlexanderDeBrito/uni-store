import Link from "next/link"
import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { formatarCpf } from "@/lib/cpf"
import { labelFormaPagamento } from "@/lib/constantes"
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
import { FiltrosVendas } from "./filtros-vendas"
import { ExcluirVendaButton } from "./excluir-venda"

export const metadata = { title: "Vendas — UNI STORE" }

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{
    de?: string
    ate?: string
    forma?: string
    q?: string
  }>
}) {
  await requireAuth()
  const { de, ate, forma, q } = await searchParams

  const dataFim = ate ? new Date(`${ate}T23:59:59.999`) : undefined
  const dataInicio = de ? new Date(`${de}T00:00:00`) : undefined
  const busca = q?.trim()
  const buscaDigitos = busca?.replace(/\D/g, "")

  const vendas = await db.venda.findMany({
    where: {
      data: {
        gte: dataInicio,
        lte: dataFim,
      },
      formaPagamento:
        forma === "CARTAO" || forma === "PIX" || forma === "DINHEIRO"
          ? forma
          : undefined,
      cliente: busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              ...(buscaDigitos
                ? [{ cpf: { contains: buscaDigitos } }]
                : []),
            ],
          }
        : undefined,
    },
    include: {
      cliente: true,
      congregacao: { include: { setor: true } },
      itens: { include: { produto: true } },
    },
    orderBy: { data: "desc" },
    take: 200,
  })

  const totalPeriodo = vendas.reduce((acc, v) => acc + v.total, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight lg:text-3xl">
            Vendas
          </h1>
          <p className="text-sm text-muted-foreground">
            {vendas.length} venda{vendas.length === 1 ? "" : "s"} ·{" "}
            {formatarBRL(totalPeriodo)} no filtro atual
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/vendas/nova" />}>
          <Plus className="size-4" /> Nova venda
        </Button>
      </div>

      <FiltrosVendas />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Congregação
                </TableHead>
                <TableHead className="hidden md:table-cell">Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Lucro
                </TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {v.data.toLocaleDateString("pt-BR")}{" "}
                    <span className="hidden sm:inline">
                      {v.data.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{v.cliente.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatarCpf(v.cliente.cpf)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {v.congregacao.nome} · {v.congregacao.setor.nome}
                  </TableCell>
                  <TableCell className="hidden max-w-52 truncate md:table-cell">
                    {v.itens
                      .map(
                        (i) =>
                          `${i.quantidade}× ${i.produto.modelo} ${i.produto.cor} ${i.produto.tamanho}`
                      )
                      .join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {labelFormaPagamento(v.formaPagamento)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatarBRL(v.total)}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    {v.lucroTotal === null ? (
                      <span
                        className="text-muted-foreground"
                        title="Sem custo registrado"
                      >
                        n/c
                      </span>
                    ) : (
                      <span className="font-medium">
                        {formatarBRL(v.lucroTotal)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false} render={<Link href={`/vendas/${v.id}/editar`} />}
                      >
                        Editar
                      </Button>
                      <ExcluirVendaButton vendaId={v.id} />
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
