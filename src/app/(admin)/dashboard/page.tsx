import Link from "next/link"
import {
  AlertTriangle,
  CalendarDays,
  Package,
  Plus,
  Shirt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { labelFormaPagamento } from "@/lib/constantes"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/layout/stat-card"

export const metadata = { title: "Dashboard — UNI STORE" }

export default async function DashboardPage() {
  await requireAuth()

  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)
  const inicioSemana = new Date(inicioDia)
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [dia, semana, mes, estoque, ultimasVendas, porProduto, atrasados] =
    await Promise.all([
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
      db.variacao.aggregate({ _sum: { estoqueAtual: true } }),
      db.venda.findMany({
        include: { itens: { include: { variacao: { include: { produto: true } } } } },
        orderBy: { data: "desc" },
        take: 5,
      }),
      db.vendaItem.groupBy({
        by: ["variacaoId"],
        _sum: { quantidade: true },
      }),
      db.pedidoProducao.findMany({
        where: {
          status: { in: ["ENCOMENDADO", "RECEBIDO_PARCIAL"] },
          dataPrevisaoEntrega: { lt: agora },
        },
        orderBy: { dataPrevisaoEntrega: "asc" },
      }),
    ])

  // Modelo mais vendido: soma as quantidades de todas as variações do modelo.
  const variacoes = await db.variacao.findMany({
    where: { id: { in: porProduto.map((p) => p.variacaoId) } },
    include: { produto: { include: { modelo: true } } },
  })
  const porModelo = new Map<string, number>()
  for (const linha of porProduto) {
    const variacao = variacoes.find((v) => v.id === linha.variacaoId)
    if (!variacao) continue
    const nome = variacao.produto.modelo?.nome ?? variacao.produto.nome
    porModelo.set(nome, (porModelo.get(nome) ?? 0) + (linha._sum.quantidade ?? 0))
  }
  const maisVendido = [...porModelo.entries()].sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Visão geral"
        titulo="Dashboard"
        subtitulo={agora.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        acao={
          <Button
            nativeButton={false}
            render={<Link href="/vendas/nova" />}
            className="rounded-xl"
          >
            <Plus className="size-4" /> Nova venda
          </Button>
        }
      />

      {atrasados.length > 0 && (
        <Link
          href="/pedidos"
          className="card-surface mb-6 flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
        >
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">
              {atrasados.length} pedido
              {atrasados.length === 1 ? "" : "s"} de produção em atraso
            </p>
            <p className="text-neutral-500">
              {atrasados
                .slice(0, 2)
                .map(
                  (p) =>
                    `${p.identificacao} (previsto ${p.dataPrevisaoEntrega.toLocaleDateString("pt-BR")})`
                )
                .join(" · ")}
              {atrasados.length > 2 && " …"} — confirme o recebimento.
            </p>
          </div>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icone={ShoppingCart}
          etiqueta="Receita hoje"
          valor={formatarBRL(dia._sum.total ?? 0)}
          detalhe={`${dia._count} venda${dia._count === 1 ? "" : "s"} realizada${dia._count === 1 ? "" : "s"}`}
        />
        <StatCard
          icone={CalendarDays}
          etiqueta="Receita da semana"
          valor={formatarBRL(semana._sum.total ?? 0)}
          detalhe="desde domingo"
        />
        <StatCard
          icone={TrendingUp}
          etiqueta="Receita do mês"
          valor={formatarBRL(mes._sum.total ?? 0)}
          detalhe={`lucro: ${formatarBRL(mes._sum.lucroTotal ?? 0)}`}
        />
        <StatCard
          icone={Package}
          etiqueta="Peças em estoque"
          valor={String(estoque._sum.estoqueAtual ?? 0)}
          detalhe="todas as variações"
          marcador="Variações"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <StatCard
          icone={Shirt}
          etiqueta="Modelo mais vendido"
          valor={maisVendido ? maisVendido[0] : "—"}
          detalhe={
            maisVendido
              ? `${maisVendido[1]} peça${maisVendido[1] === 1 ? "" : "s"} vendida${maisVendido[1] === 1 ? "" : "s"}`
              : "nenhuma venda registrada ainda"
          }
          destaque
        />

        <div className="card-surface overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Últimas vendas
              </h2>
              <p className="mt-0.5 text-xs text-neutral-400">
                Transações mais recentes do sistema
              </p>
            </div>
            <Link
              href="/vendas"
              className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th-label pl-6">Data</th>
                  <th className="th-label">Cliente</th>
                  <th className="th-label hidden md:table-cell">Itens</th>
                  <th className="th-label">Pagamento</th>
                  <th className="th-label pr-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ultimasVendas.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-neutral-400"
                    >
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
                {ultimasVendas.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-4 pl-6 text-sm font-medium whitespace-nowrap text-neutral-400">
                      {v.data.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                          {v.clienteNome.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-neutral-800">
                          {v.clienteNome}
                        </span>
                      </div>
                    </td>
                    <td
                      className="hidden max-w-52 truncate px-4 py-4 text-sm text-neutral-600 md:table-cell"
                      title={v.itens
                        .map(
                          (i) =>
                            `${i.quantidade}× ${i.variacao.produto.nome} ${i.variacao.cor} ${i.variacao.tamanho}`
                        )
                        .join(", ")}
                    >
                      {v.itens
                        .map(
                          (i) =>
                            `${i.quantidade}× ${i.variacao.produto.nome} ${i.variacao.cor} ${i.variacao.tamanho}`
                        )
                        .join(", ")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {labelFormaPagamento(v.formaPagamento)}
                      </span>
                    </td>
                    <td className="px-4 py-4 pr-6 text-right text-sm font-bold text-neutral-900">
                      {formatarBRL(v.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
