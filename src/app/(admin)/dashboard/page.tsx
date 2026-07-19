import Link from "next/link"
import {
  CalendarDays,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { labelFormaPagamento } from "@/lib/constantes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Dashboard — UNI STORE" }

export default async function DashboardPage() {
  await requireAuth()

  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)
  const inicioSemana = new Date(inicioDia)
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [dia, semana, mes, estoque, ultimasVendas] = await Promise.all([
    db.venda.aggregate({
      where: { data: { gte: inicioDia } },
      _sum: { total: true },
      _count: true,
    }),
    db.venda.aggregate({
      where: { data: { gte: inicioSemana } },
      _sum: { total: true },
    }),
    db.venda.aggregate({
      where: { data: { gte: inicioMes } },
      _sum: { total: true, lucroTotal: true },
    }),
    db.produto.aggregate({ _sum: { estoqueAtual: true } }),
    db.venda.findMany({
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
      orderBy: { data: "desc" },
      take: 5,
    }),
  ])

  const cards = [
    {
      titulo: "Receita hoje",
      valor: formatarBRL(dia._sum.total ?? 0),
      detalhe: `${dia._count} venda${dia._count === 1 ? "" : "s"}`,
      icone: ShoppingCart,
    },
    {
      titulo: "Receita da semana",
      valor: formatarBRL(semana._sum.total ?? 0),
      detalhe: "desde domingo",
      icone: CalendarDays,
    },
    {
      titulo: "Receita do mês",
      valor: formatarBRL(mes._sum.total ?? 0),
      detalhe: `lucro: ${formatarBRL(mes._sum.lucroTotal ?? 0)}`,
      icone: TrendingUp,
    },
    {
      titulo: "Peças em estoque",
      valor: String(estoque._sum.estoqueAtual ?? 0),
      detalhe: "todas as SKUs",
      icone: Package,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {agora.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button render={<Link href="/vendas/nova" />} size="lg">
          <ShoppingCart className="size-4" /> Nova venda
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((c) => (
          <Card key={c.titulo}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.titulo}</p>
                <c.icone className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-2xl font-bold">{c.valor}</p>
              <p className="text-xs text-muted-foreground">{c.detalhe}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimasVendas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma venda registrada ainda.
                  </TableCell>
                </TableRow>
              )}
              {ultimasVendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {v.data.toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {v.cliente.nome}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
