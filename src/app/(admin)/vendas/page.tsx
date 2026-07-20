import Link from "next/link"
import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { FiltrosVendas } from "./filtros-vendas"
import { VendasTabela, type VendaLinha } from "./vendas-tabela"

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
      data: { gte: dataInicio, lte: dataFim },
      formaPagamento:
        forma === "CARTAO" || forma === "PIX" || forma === "DINHEIRO"
          ? forma
          : undefined,
      ...(busca && {
        OR: [
          { clienteNome: { contains: busca, mode: "insensitive" as const } },
          ...(buscaDigitos
            ? [{ cliente: { cpf: { contains: buscaDigitos } } }]
            : []),
        ],
      }),
    },
    include: {
      cliente: true,
      congregacao: { include: { setor: true } },
      evento: { select: { nome: true } },
      itens: { include: { produto: { include: { modelo: true } } } },
    },
    orderBy: { data: "desc" },
    take: 200,
  })

  const totalPeriodo = vendas.reduce((acc, v) => acc + v.total, 0)

  const linhas: VendaLinha[] = vendas.map((v) => ({
    id: v.id,
    data: `${v.data.toLocaleDateString("pt-BR")} ${v.data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    clienteNome: v.clienteNome,
    cpf: v.cliente?.cpf ?? null,
    congregacao: v.congregacao?.nome ?? null,
    setor: v.congregacao?.setor.nome ?? null,
    lider: v.liderNome,
    evento: v.evento?.nome ?? null,
    formaPagamento: v.formaPagamento,
    total: v.total,
    lucroTotal: v.lucroTotal,
    observacoes: v.observacoes,
    itens: v.itens.map((i) => ({
      descricao: `${i.produto.modelo.nome} ${i.produto.cor} — ${i.produto.tamanho}`,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      subtotal: i.precoUnitario * i.quantidade,
    })),
  }))

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Movimento"
        titulo="Vendas"
        subtitulo={`${vendas.length} venda${vendas.length === 1 ? "" : "s"} · ${formatarBRL(totalPeriodo)} no filtro atual`}
        acao={
          <Button
            className="rounded-xl"
            nativeButton={false}
            render={<Link href="/vendas/nova" />}
          >
            <Plus className="size-4" /> Nova venda
          </Button>
        }
      />

      <FiltrosVendas />

      <VendasTabela vendas={linhas} />
    </div>
  )
}
