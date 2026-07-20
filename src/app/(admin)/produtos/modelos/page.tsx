import { FileText, Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { storageConfigurado } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { ProdutosTabs } from "../tabs"
import { ModeloDialog } from "./modelo-dialog"
import { ExcluirModeloButton } from "./excluir-modelo"

export const metadata = { title: "Modelos — UNI STORE" }

export default async function ModelosPage() {
  await requireAuth()

  const modelos = await db.modelo.findMany({
    include: { _count: { select: { produtos: true } } },
    orderBy: { nome: "asc" },
  })
  const uploadDisponivel = storageConfigurado()

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Catálogo"
        titulo="Modelos"
        subtitulo="Cadastre uma vez e reutilize no sistema inteiro — sem erro de digitação"
        acao={
          <ModeloDialog
            uploadDisponivel={uploadDisponivel}
            trigger={
              <Button className="rounded-xl">
                <Plus className="size-4" /> Novo modelo
              </Button>
            }
          />
        }
      />

      <ProdutosTabs />

      {modelos.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
          <FileText className="size-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Nenhum modelo cadastrado ainda.
          </p>
          <ModeloDialog
            uploadDisponivel={uploadDisponivel}
            trigger={
              <Button variant="outline" className="rounded-xl">
                <Plus className="size-4" /> Cadastrar o primeiro modelo
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modelos.map((m) => {
            const ehPdf = m.arquivoTipo === "application/pdf"
            return (
              <div key={m.id} className="card-surface overflow-hidden">
                <div className="flex h-44 items-center justify-center bg-neutral-100">
                  {m.arquivoUrl && !ehPdf ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.arquivoUrl}
                      alt={m.nome}
                      className="size-full object-cover"
                    />
                  ) : m.arquivoUrl && ehPdf ? (
                    <a
                      href={m.arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 text-neutral-500 hover:text-neutral-800"
                    >
                      <FileText className="size-10" />
                      <span className="text-xs font-medium underline">
                        Abrir PDF
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-300">
                      <FileText className="size-10" />
                      <span className="text-xs">Sem arte</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-900">
                        {m.nome}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {m._count.produtos} produto
                        {m._count.produtos === 1 ? "" : "s"}
                        {!m.ativo && " · inativo"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.ativo
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {m.descricao && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                      {m.descricao}
                    </p>
                  )}
                  <div className="mt-3 flex gap-1">
                    <ModeloDialog
                      modelo={m}
                      uploadDisponivel={uploadDisponivel}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          Editar
                        </Button>
                      }
                    />
                    <ExcluirModeloButton modeloId={m.id} nome={m.nome} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
