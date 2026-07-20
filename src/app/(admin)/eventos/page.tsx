import Link from "next/link"
import { CalendarDays, Copy, MapPin, Plus, Ticket } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { STATUS_EVENTO } from "@/lib/constantes"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { EventoDialog } from "./evento-dialog"
import { CopiarLink } from "./copiar-link"
import { DuplicarEventoButton } from "./duplicar-evento"

export const metadata = { title: "Eventos — UNI STORE" }

function paraInput(data: Date | null): string {
  return data ? data.toISOString().slice(0, 10) : ""
}

export default async function EventosPage() {
  await requireAuth()

  const eventos = await db.evento.findMany({
    include: {
      _count: { select: { vendas: true, reservas: true } },
      vendas: { select: { total: true } },
    },
    orderBy: { dataInicio: "desc" },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Eventos"
        titulo="Eventos"
        subtitulo="Vigílias, conferências e ações — cada um com seu link público de reserva"
        acao={
          <EventoDialog
            trigger={
              <Button className="rounded-xl">
                <Plus className="size-4" /> Novo evento
              </Button>
            }
          />
        }
      />

      {eventos.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
          <CalendarDays className="size-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Nenhum evento criado ainda. Crie um para gerar o link de reservas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {eventos.map((e) => {
            const receita = e.vendas.reduce((a, v) => a + v.total, 0)
            const encerrado = e.status === "ENCERRADO"
            return (
              <div key={e.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">
                        {e.nome}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          e.status === "ATIVO"
                            ? "bg-neutral-900 text-white"
                            : encerrado
                              ? "bg-neutral-100 text-neutral-400"
                              : "border border-neutral-200 bg-neutral-50 text-neutral-700"
                        }`}
                      >
                        {STATUS_EVENTO[e.status as keyof typeof STATUS_EVENTO]}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {e.dataInicio.toLocaleDateString("pt-BR")}
                        {e.dataFim &&
                          ` – ${e.dataFim.toLocaleDateString("pt-BR")}`}
                      </span>
                      {e.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {e.local}
                        </span>
                      )}
                    </p>
                    {e.prazoReserva && (
                      <p className="mt-1 text-xs text-neutral-400">
                        Reservas até{" "}
                        {e.prazoReserva.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4">
                  <div>
                    <p className="eyebrow mb-0.5">Vendas</p>
                    <p className="text-sm font-bold">{e._count.vendas}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Reservas</p>
                    <p className="text-sm font-bold">{e._count.reservas}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Receita</p>
                    <p className="text-sm font-bold">{formatarBRL(receita)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <CopiarLink slug={e.slug} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    nativeButton={false}
                    render={
                      <a
                        href={`/r/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <Ticket className="size-4" /> Abrir página
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    nativeButton={false}
                    render={<Link href={`/reservas?evento=${e.id}`} />}
                  >
                    Ver reservas
                  </Button>
                  <EventoDialog
                    evento={{
                      id: e.id,
                      nome: e.nome,
                      descricao: e.descricao,
                      local: e.local,
                      dataInicio: paraInput(e.dataInicio),
                      dataFim: paraInput(e.dataFim),
                      prazoReserva: paraInput(e.prazoReserva),
                      status: e.status,
                    }}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    }
                  />
                  <DuplicarEventoButton eventoId={e.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
