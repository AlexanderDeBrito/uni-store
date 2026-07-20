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
      include: { modelo: true },
      orderBy: [{ modelo: { nome: "asc" } }, { cor: "asc" }, { tamanho: "asc" }],
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
          label: `${p.modelo.nome} ${p.cor} — ${p.tamanho}`,
          precoVenda: p.precoVenda,
          // O estoque já foi baixado por esta venda: soma de volta o que ela consumiu
          // para que a edição não acuse falta indevida.
          estoqueAtual:
            p.estoqueAtual +
            (venda.itens.find((i) => i.produtoId === p.id)?.quantidade ?? 0),
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
            produtoId: i.produtoId,
            quantidade: i.quantidade,
          })),
        }}
      />
    </div>
  )
}
