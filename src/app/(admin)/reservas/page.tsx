import { Check, Package, Ticket } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatarBRL } from "@/lib/money"
import { STATUS_RESERVA, labelFormaPagamento } from "@/lib/constantes"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/layout/stat-card"
import { liberarReservasVencidas } from "@/server/reservas"
import { FiltrosReservas } from "./filtros-reservas"
import { AcoesReserva } from "./acoes-reserva"
import { RetiradaDialog } from "./retirada-dialog"

export const metadata = { title: "Reservas — UNI STORE" }

const ESTILO_STATUS: Record<string, string> = {
  RETIRADA: "bg-neutral-900 text-white",
  CANCELADA: "bg-neutral-100 text-neutral-400",
  INADIMPLENTE: "bg-destructive/10 text-destructive",
  RESERVADA: "border border-neutral-200 bg-neutral-50 text-neutral-700",
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; evento?: string; status?: string }>
}) {
  await requireAuth()

  // Reservas de eventos que já passaram voltam ao estoque automaticamente.
  await liberarReservasVencidas()

  const { q, evento, status } = await searchParams
  const busca = q?.trim()

  const [reservas, eventos] = await Promise.all([
    db.reserva.findMany({
      where: {
        eventoId: evento || undefined,
        status:
          status === "RESERVADA" ||
          status === "RETIRADA" ||
          status === "CANCELADA" ||
          status === "INADIMPLENTE"
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
        itens: { include: { produto: { include: { modelo: true } } } },
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

  const abertas = reservas.filter((r) => r.status === "RESERVADA")
  const pecasPresas = abertas.reduce(
    (acc, r) => acc + r.itens.reduce((s, i) => s + i.quantidade, 0),
    0
  )
  const valorPrevisto = abertas.reduce(
    (acc, r) =>
      acc + r.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0),
    0
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Eventos"
        titulo="Reservas"
        subtitulo="Pedidos feitos pelo link público — separe as peças e confirme a retirada"
      />

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icone={Ticket}
          etiqueta="Aguardando retirada"
          valor={String(abertas.length)}
          detalhe={`de ${reservas.length} reserva(s) no filtro`}
        />
        <StatCard
          icone={Package}
          etiqueta="Peças separadas"
          valor={String(pecasPresas)}
          detalhe="presas no estoque"
          destaque
        />
        <StatCard
          icone={Check}
          etiqueta="Valor previsto"
          valor={formatarBRL(valorPrevisto)}
          detalhe="a receber nas retiradas"
        />
      </div>

      <FiltrosReservas eventos={eventos} />

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Código</th>
                <th className="th-label">Cliente</th>
                <th className="th-label hidden md:table-cell">Peças</th>
                <th className="th-label hidden lg:table-cell">Evento</th>
                <th className="th-label text-right">Total</th>
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
              {reservas.map((r) => {
                const total = r.itens.reduce(
                  (acc, i) => acc + i.precoUnitario * i.quantidade,
                  0
                )
                const pecas = r.itens.reduce((acc, i) => acc + i.quantidade, 0)
                return (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-neutral-50/60"
                  >
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
                    <td className="hidden max-w-64 px-4 py-4 text-sm text-neutral-600 md:table-cell">
                      <p className="truncate">
                        {r.itens
                          .map(
                            (i) =>
                              `${i.quantidade}× ${i.produto.modelo.nome} ${i.produto.cor} ${i.produto.tamanho}`
                          )
                          .join(", ")}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {pecas} peça{pecas === 1 ? "" : "s"}
                        {r.formaPagamento &&
                          ` · pretende ${labelFormaPagamento(r.formaPagamento)}`}
                      </p>
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-neutral-500 lg:table-cell">
                      {r.evento.nome}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-neutral-900">
                      {formatarBRL(total)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_STATUS[r.status]}`}
                      >
                        {STATUS_RESERVA[r.status as keyof typeof STATUS_RESERVA]}
                      </span>
                    </td>
                    <td className="px-4 py-4 pr-6 text-right">
                      {r.status === "RESERVADA" && (
                        <div className="flex items-center justify-end gap-1">
                          <RetiradaDialog
                            reservaId={r.id}
                            codigo={r.codigo}
                            nome={r.nome}
                            itens={r.itens.map((i) => ({
                              id: i.id,
                              descricao: `${i.produto.modelo.nome} ${i.produto.cor} — ${i.produto.tamanho}`,
                              quantidade: i.quantidade,
                              precoUnitario: i.precoUnitario,
                              disponivelExtra:
                                i.produto.estoqueAtual -
                                i.produto.estoqueReservado,
                            }))}
                            trigger={
                              <Button size="sm" className="rounded-xl">
                                <Check className="size-4" /> Retirar
                              </Button>
                            }
                          />
                          <AcoesReserva reservaId={r.id} />
                        </div>
                      )}
                      {r.status === "RETIRADA" && r.dataRetirada && (
                        <span className="text-xs text-neutral-400">
                          {r.dataRetirada.toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
