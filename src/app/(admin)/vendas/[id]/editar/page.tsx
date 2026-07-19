import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { VendaForm } from "../../venda-form"

export const metadata = { title: "Editar venda — UNI STORE" }

export default async function EditarVendaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const [venda, setores, congregacoes, produtos] = await Promise.all([
    db.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        congregacao: true,
        itens: true,
      },
    }),
    db.setor.findMany({ orderBy: { nome: "asc" } }),
    db.congregacao.findMany({ orderBy: { nome: "asc" } }),
    db.produto.findMany({
      orderBy: [{ modelo: "asc" }, { cor: "asc" }, { tamanho: "asc" }],
    }),
  ])

  if (!venda) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Editar venda
        </h1>
        <p className="text-sm text-muted-foreground">
          O estoque é ajustado automaticamente ao salvar
        </p>
      </div>
      <VendaForm
        setores={setores.map((s) => ({ id: s.id, nome: s.nome }))}
        congregacoes={congregacoes.map((c) => ({
          id: c.id,
          nome: c.nome,
          setorId: c.setorId,
          lider: c.lider,
        }))}
        produtos={produtos.map((p) => ({
          id: p.id,
          label: `${p.modelo} ${p.cor} — ${p.tamanho}`,
          precoVenda: p.precoVenda,
          estoqueAtual: p.estoqueAtual,
        }))}
        vendaInicial={{
          id: venda.id,
          cpf: venda.cliente.cpf,
          nome: venda.cliente.nome,
          setorId: venda.congregacao.setorId,
          congregacaoId: venda.congregacaoId,
          liderNome: venda.liderNome,
          formaPagamento: venda.formaPagamento,
          observacoes: venda.observacoes ?? "",
          itens: venda.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
          })),
        }}
      />
    </div>
  )
}
