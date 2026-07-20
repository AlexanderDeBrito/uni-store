import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { VendaForm } from "../../venda-form"

export const metadata = { title: "Editar venda — UNI STORE" }

export default async function EditarVendaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const [venda, setores, congregacoes, produtos, eventos] = await Promise.all([
    db.venda.findUnique({
      where: { id },
      include: { cliente: true, congregacao: true, itens: true },
    }),
    db.setor.findMany({ orderBy: { nome: "asc" } }),
    db.congregacao.findMany({ orderBy: { nome: "asc" } }),
    db.produto.findMany({
      include: { variacoes: { orderBy: [{ cor: "asc" }, { tamanho: "asc" }] } },
      orderBy: { nome: "asc" },
    }),
    db.evento.findMany({
      orderBy: { dataInicio: "desc" },
      select: { id: true, nome: true },
    }),
  ])

  if (!venda) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Movimento"
        titulo="Editar venda"
        subtitulo="O estoque é ajustado automaticamente ao salvar"
      />
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
          nome: p.nome,
          precoVenda: p.precoVenda,
          variacoes: p.variacoes.map((v) => ({
            id: v.id,
            cor: v.cor,
            tamanho: v.tamanho,
            // Esta venda já baixou o estoque: soma de volta o que ela consumiu
            // para a edição não acusar falta indevida.
            disponivel:
              v.estoqueAtual -
              v.estoqueReservado +
              (venda.itens.find((i) => i.variacaoId === v.id)?.quantidade ?? 0),
          })),
        }))}
        eventos={eventos}
        vendaInicial={{
          id: venda.id,
          cpf: venda.cliente?.cpf ?? "",
          nome: venda.clienteNome,
          setorId: venda.congregacao?.setorId ?? "",
          congregacaoId: venda.congregacaoId ?? "",
          liderNome: venda.liderNome ?? "",
          eventoId: venda.eventoId ?? "",
          formaPagamento: venda.formaPagamento,
          observacoes: venda.observacoes ?? "",
          itens: venda.itens.map((i) => ({
            variacaoId: i.variacaoId,
            quantidade: i.quantidade,
          })),
        }}
      />
    </div>
  )
}
