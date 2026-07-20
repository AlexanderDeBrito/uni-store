import { Search, Ticket } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { STATUS_RESERVA, labelFormaPagamento } from "@/lib/constantes"
import { PageHeader } from "@/components/layout/page-header"
import { FiltrosReservas } from "./filtros-reservas"
import { AcoesReserva } from "./acoes-reserva"

export const metadata = { title: "Reservas — UNI STORE" }

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; evento?: string; status?: string }>
}) {
  await requireAuth()
  const { q, evento, status } = await searchParams
  const busca = q?.trim()

  const [reservas, eventos] = await Promise.all([
    db.reserva.findMany({
      where: {
        eventoId: evento || undefined,
        status:
          status === "RESERVADA" ||
          status === "RETIRADA" ||
          status === "CANCELADA"
            ? status
            : undefined,
        ...(busca && {
          OR: [
            { nome: { contains: busca, mode: "insensitive" as const } },
            { telefone: { contains: busca } },
            { codigo: { contains: busca.toUpperCase() } },
          ],
        }),
      },
      include: {
        produto: { include: { modelo: true } },
        evento: { select: { nome: true } },
        congregacao: { select: { nome: true } },
      },
      orderBy: { dataReserva: "desc" },
      take: 200,
    }),
    db.evento.findMany({
      orderBy: { dataInicio: "desc" },
      select: { id: true, nome: true },
    }),
  ])

  const pendentes = reservas.filter((r) => r.status === "RESERVADA").length

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Eventos"
        titulo="Reservas"
        subtitulo={`${reservas.length} reserva${reservas.length === 1 ? "" : "s"} · ${pendentes} aguardando retirada`}
      />

      <FiltrosReservas eventos={eventos} />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Código</th>
                <th className="th-label">Cliente</th>
                <th className="th-label hidden md:table-cell">Produto</th>
                <th className="th-label hidden lg:table-cell">Evento</th>
                <th className="th-label">Pagamento</th>
                <th className="th-label">Status</th>
                <th className="th-label pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Ticket className="mx-auto mb-2 size-8 text-neutral-300" />
                    <p className="text-sm text-neutral-400">
                      {busca
                        ? "Nenhuma reserva encontrada para essa busca."
                        : "Nenhuma reserva registrada ainda."}
                    </p>
                  </td>
                </tr>
              )}
              {reservas.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-neutral-50/60">
                  <td className="px-4 py-4 pl-6">
                    <span className="rounded-lg bg-neutral-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                      {r.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-neutral-800">
                      {r.nome}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {r.telefone}
                      {r.congregacao && ` · ${r.congregacao.nome}`}
                    </p>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-600 md:table-cell">
                    {r.quantidade}× {r.produto.modelo.nome} {r.produto.cor} —{" "}
                    {r.produto.tamanho}
                    <span className="block text-xs text-neutral-400">
                      {formatarBRL(r.produto.precoVenda * r.quantidade)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-500 lg:table-cell">
                    {r.evento.nome}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600">
                    {labelFormaPagamento(
                      r.formaPagamentoEfetiva ?? r.formaPagamento
                    )}
                    {!r.formaPagamentoEfetiva && (
                      <span className="block text-xs text-neutral-400">
                        pretendida
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.status === "RETIRADA"
                          ? "bg-neutral-900 text-white"
                          : r.status === "CANCELADA"
                            ? "bg-neutral-100 text-neutral-400"
                            : "border border-neutral-200 bg-neutral-50 text-neutral-700"
                      }`}
                    >
                      {STATUS_RESERVA[r.status as keyof typeof STATUS_RESERVA]}
                    </span>
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    {r.status === "RESERVADA" && (
                      <AcoesReserva
                        reservaId={r.id}
                        codigo={r.codigo}
                        estoqueDisponivel={r.produto.estoqueAtual}
                        quantidade={r.quantidade}
                      />
                    )}
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
