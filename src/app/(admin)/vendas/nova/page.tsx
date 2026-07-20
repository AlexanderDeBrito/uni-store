import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { VendaForm } from "../venda-form"

export const metadata = { title: "Nova venda — UNI STORE" }

export default async function NovaVendaPage() {
  await requireAuth()

  const [setores, congregacoes, produtos, eventos] = await Promise.all([
    db.setor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.congregacao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.produto.findMany({
      where: { ativo: true },
      include: { variacoes: { orderBy: [{ cor: "asc" }, { tamanho: "asc" }] } },
      orderBy: { nome: "asc" },
    }),
    db.evento.findMany({
      where: { status: { in: ["PLANEJADO", "ATIVO"] } },
      orderBy: { dataInicio: "desc" },
      select: { id: true, nome: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Movimento"
        titulo="Nova venda"
        subtitulo="A confirmação desconta do estoque em tempo real"
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
            disponivel: v.estoqueAtual - v.estoqueReservado,
          })),
        }))}
        eventos={eventos}
      />
    </div>
  )
}
