import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { VendaForm } from "../venda-form"

export const metadata = { title: "Nova venda — UNI STORE" }

export default async function NovaVendaPage() {
  await requireAuth()

  const [setores, congregacoes, produtos] = await Promise.all([
    db.setor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.congregacao.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    db.produto.findMany({
      orderBy: [{ modelo: "asc" }, { cor: "asc" }, { tamanho: "asc" }],
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Nova venda
        </h1>
        <p className="text-sm text-muted-foreground">
          A confirmação desconta do estoque em tempo real
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
      />
    </div>
  )
}
