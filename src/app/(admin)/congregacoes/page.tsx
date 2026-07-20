import { Plus, Users } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { CongregacaoDialog } from "./congregacao-dialog"
import { FiltroSetor } from "./filtro-setor"

export const metadata = { title: "Congregações — UNI STORE" }

export default async function CongregacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string }>
}) {
  await requireAuth()
  const { setor: setorId } = await searchParams

  const [setores, congregacoes] = await Promise.all([
    db.setor.findMany({ orderBy: { nome: "asc" } }),
    db.congregacao.findMany({
      where: setorId ? { setorId } : undefined,
      include: { setor: true },
      orderBy: [{ setor: { nome: "asc" } }, { nome: "asc" }],
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Organização"
        titulo="Congregações"
        subtitulo="Congregações e líderes de jovens por setor"
        acao={
          <CongregacaoDialog
            setores={setores}
            trigger={
              <Button className="rounded-xl" disabled={setores.length === 0}>
                <Plus className="size-4" /> Nova congregação
              </Button>
            }
          />
        }
      />

      <div className="mb-4">
        <FiltroSetor setores={setores} setorSelecionado={setorId ?? ""} />
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Congregação</th>
                <th className="th-label">Setor</th>
                <th className="th-label hidden sm:table-cell">
                  Líder de jovens
                </th>
                <th className="th-label">Status</th>
                <th className="th-label pr-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {congregacoes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    {setores.length === 0
                      ? "Cadastre um setor antes de criar congregações."
                      : "Nenhuma congregação encontrada."}
                  </td>
                </tr>
              )}
              {congregacoes.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-neutral-50/60">
                  <td className="px-4 py-4 pl-6">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <Users className="size-4 text-neutral-500" />
                      </span>
                      <span className="text-sm font-medium text-neutral-900">
                        {c.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {c.setor.nome}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-500 sm:table-cell">
                    {c.lider}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        c.ativo
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {c.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <CongregacaoDialog
                      setores={setores}
                      congregacao={c}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
