import { Building2, MapPin, Plus, Users } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/layout/stat-card"
import { SetorDialog } from "./setor-dialog"

export const metadata = { title: "Setores — UNI STORE" }

export default async function SetoresPage() {
  await requireAuth()

  const [setores, totalCongregacoes] = await Promise.all([
    db.setor.findMany({
      include: { _count: { select: { congregacoes: true } } },
      orderBy: { nome: "asc" },
    }),
    db.congregacao.count(),
  ])

  const ativos = setores.filter((s) => s.ativo).length

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Organização"
        titulo="Setores"
        subtitulo="Gerencie os setores e regiões da organização"
        acao={
          <SetorDialog
            trigger={
              <Button className="rounded-xl">
                <Plus className="size-4" /> Novo setor
              </Button>
            }
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icone={Building2}
          etiqueta="Total de setores"
          valor={String(setores.length)}
        />
        <StatCard
          icone={Building2}
          etiqueta="Setores ativos"
          valor={String(ativos)}
          detalhe="aparecem nos formulários"
        />
        <StatCard
          icone={Users}
          etiqueta="Congregações"
          valor={String(totalCongregacoes)}
        />
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-neutral-100 px-6 py-5">
          <h2 className="text-base font-semibold text-neutral-900">
            Lista de setores
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {setores.length} setor{setores.length === 1 ? "" : "es"} cadastrado
            {setores.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Nome</th>
                <th className="th-label hidden sm:table-cell">Região</th>
                <th className="th-label">Congregações</th>
                <th className="th-label">Status</th>
                <th className="th-label pr-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {setores.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    Nenhum setor cadastrado. Crie o primeiro para liberar o
                    cadastro de congregações.
                  </td>
                </tr>
              )}
              {setores.map((setor) => (
                <tr
                  key={setor.id}
                  className="transition-colors hover:bg-neutral-50/60"
                >
                  <td className="px-4 py-4 pl-6">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <Building2 className="size-4 text-neutral-500" />
                      </span>
                      <span className="text-sm font-medium text-neutral-900">
                        {setor.nome}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-500 sm:table-cell">
                    {setor.regiao ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {setor.regiao}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-700">
                    <strong>{setor._count.congregacoes}</strong>{" "}
                    <span className="text-neutral-400">
                      congregaç{setor._count.congregacoes === 1 ? "ão" : "ões"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        setor.ativo
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {setor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <SetorDialog
                      setor={setor}
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
