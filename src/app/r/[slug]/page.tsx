import { notFound } from "next/navigation"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { db } from "@/lib/db"
import { descreverVariacao } from "@/lib/produto"
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

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-neutral-900">{titulo}</h2>
      <p className="mt-2 text-sm text-neutral-500">{texto}</p>
    </div>
  )
}

export default async function ReservaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const evento = await db.evento.findUnique({
    where: { slug },
    include: {
      produtos: {
        include: { variacao: { include: { produto: true } } },
      },
    },
  })
  if (!evento) notFound()

  const [setores, congregacoes] = await Promise.all([
    db.setor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.congregacao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ])

  const expirado = evento.prazoReserva !== null && evento.prazoReserva < new Date()
  const encerrado = evento.status === "ENCERRADO"

  // Só entram peças escolhidas para este evento e que ainda têm saldo livre.
  const disponiveis = evento.produtos
    .map((ep) => ({
      id: ep.variacao.id,
      label: `${ep.variacao.produto.nome} ${descreverVariacao(ep.variacao)}`,
      precoVenda: ep.variacao.produto.precoVenda,
      disponivel: ep.variacao.estoqueAtual - ep.variacao.estoqueReservado,
    }))
    .filter((p) => p.disponivel > 0)

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

        {encerrado ? (
          <Aviso
            titulo="Reservas encerradas"
            texto="Este evento já foi encerrado."
          />
        ) : expirado ? (
          <Aviso
            titulo="Link expirado"
            texto={`O prazo para reservas terminou em ${evento.prazoReserva?.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`}
          />
        ) : evento.produtos.length === 0 ? (
          <Aviso
            titulo="Reservas ainda não liberadas"
            texto="As peças deste evento ainda não foram disponibilizadas para reserva. Tente novamente em breve."
          />
        ) : disponiveis.length === 0 ? (
          <Aviso
            titulo="Peças esgotadas"
            texto="Todas as peças deste evento já foram reservadas."
          />
        ) : (
          <ReservaForm
            eventoId={evento.id}
            produtos={disponiveis}
            setores={setores.map((s) => ({ id: s.id, nome: s.nome }))}
            congregacoes={congregacoes.map((c) => ({
              id: c.id,
              nome: c.nome,
              setorId: c.setorId,
            }))}
          />
        )}

        {evento.prazoReserva && !expirado && !encerrado && (
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
            <Clock className="size-3.5" />
            Reservas até{" "}
            {evento.prazoReserva.toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            . O pagamento é feito na retirada.
          </p>
        )}
      </div>
    </main>
  )
}
