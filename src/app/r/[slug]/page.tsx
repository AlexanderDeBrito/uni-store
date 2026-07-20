import { notFound } from "next/navigation"
import { CalendarDays, MapPin } from "lucide-react"
import { db } from "@/lib/db"
import { ReservaForm } from "./reserva-form"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const evento = await db.evento.findUnique({ where: { slug } })
  return { title: evento ? `Reservar — ${evento.nome}` : "Reserva — UNI STORE" }
}

export default async function ReservaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const evento = await db.evento.findUnique({ where: { slug } })
  if (!evento) notFound()

  const [produtos, setores, congregacoes] = await Promise.all([
    db.produto.findMany({
      where: { estoqueAtual: { gt: 0 } },
      include: { modelo: true },
      orderBy: [{ modelo: { nome: "asc" } }, { cor: "asc" }, { tamanho: "asc" }],
    }),
    db.setor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.congregacao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ])

  const fechado =
    evento.status === "ENCERRADO" ||
    (evento.prazoReserva !== null && evento.prazoReserva < new Date())

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase">
            UNI STORE
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">{evento.nome}</h1>
          {evento.descricao && (
            <p className="mt-2 text-sm text-neutral-400">{evento.descricao}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {evento.dataInicio.toLocaleDateString("pt-BR")}
              {evento.dataFim &&
                ` – ${evento.dataFim.toLocaleDateString("pt-BR")}`}
            </span>
            {evento.local && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {evento.local}
              </span>
            )}
          </div>
        </div>

        {fechado ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              Reservas encerradas
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {evento.status === "ENCERRADO"
                ? "Este evento já foi encerrado."
                : `O prazo para reservas terminou em ${evento.prazoReserva?.toLocaleDateString("pt-BR")}.`}
            </p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              Sem produtos disponíveis
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              No momento não há peças em estoque para reserva. Tente novamente
              mais tarde.
            </p>
          </div>
        ) : (
          <ReservaForm
            eventoId={evento.id}
            produtos={produtos.map((p) => ({
              id: p.id,
              label: `${p.modelo.nome} ${p.cor} — ${p.tamanho}`,
              precoVenda: p.precoVenda,
            }))}
            setores={setores.map((s) => ({ id: s.id, nome: s.nome }))}
            congregacoes={congregacoes.map((c) => ({
              id: c.id,
              nome: c.nome,
              setorId: c.setorId,
            }))}
          />
        )}

        {evento.prazoReserva && !fechado && (
          <p className="mt-6 text-center text-xs text-neutral-500">
            Reservas até {evento.prazoReserva.toLocaleDateString("pt-BR")}. O
            pagamento é feito na retirada, no evento.
          </p>
        )}
      </div>
    </main>
  )
}
