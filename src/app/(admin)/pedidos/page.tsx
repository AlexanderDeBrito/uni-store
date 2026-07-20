import {
  AlertTriangle,
  ClipboardList,
  FileText,
  PackageCheck,
  Plus,
} from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { storageConfigurado } from "@/lib/storage"
import { formatarBRL } from "@/lib/money"
import { STATUS_PEDIDO, pedidoAtrasado } from "@/lib/constantes"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { PedidoDialog } from "./pedido-dialog"
import { RecebimentoDialog } from "./recebimento-dialog"

export const metadata = { title: "Pedidos de produção — UNI STORE" }

function PilulaStatus({
  status,
  atrasado,
}: {
  status: string
  atrasado: boolean
}) {
  if (atrasado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        <AlertTriangle className="size-3" /> Em atraso
      </span>
    )
  }
  const estilo =
    status === "RECEBIDO"
      ? "bg-neutral-900 text-white"
      : status === "CANCELADO"
        ? "bg-neutral-100 text-neutral-400 line-through"
        : "border border-neutral-200 bg-neutral-50 text-neutral-700"
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}>
      {STATUS_PEDIDO[status as keyof typeof STATUS_PEDIDO] ?? status}
    </span>
  )
}

export default async function PedidosPage() {
  await requireAuth()

  const [pedidos, modelos, eventos] = await Promise.all([
    db.pedidoProducao.findMany({
      include: {
        itens: { include: { modelo: true } },
        evento: { select: { nome: true } },
      },
      orderBy: { dataPedido: "desc" },
    }),
    db.modelo.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    db.evento.findMany({
      where: { status: { in: ["PLANEJADO", "ATIVO"] } },
      orderBy: { dataInicio: "desc" },
      select: { id: true, nome: true },
    }),
  ])

  const uploadDisponivel = storageConfigurado()
  const atrasados = pedidos.filter(pedidoAtrasado)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Produção"
        titulo="Pedidos de produção"
        subtitulo="Encomendas à fábrica — do pedido ao recebimento no estoque"
        acao={
          <PedidoDialog
            modelos={modelos}
            eventos={eventos}
            uploadDisponivel={uploadDisponivel}
            trigger={
              <Button className="rounded-xl" disabled={modelos.length === 0}>
                <Plus className="size-4" /> Novo pedido
              </Button>
            }
          />
        }
      />

      {atrasados.length > 0 && (
        <div className="card-surface mb-6 flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p className="text-sm">
            <span className="font-semibold text-destructive">
              {atrasados.length} pedido{atrasados.length === 1 ? "" : "s"} passou
              da data prevista
            </span>{" "}
            <span className="text-neutral-500">
              e ainda não teve o recebimento confirmado.
            </span>
          </p>
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
          <ClipboardList className="size-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            {modelos.length === 0
              ? "Cadastre um modelo antes de registrar pedidos de produção."
              : "Nenhum pedido de produção registrado ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => {
            const atrasado = pedidoAtrasado(p)
            const totalPecas = p.itens.reduce(
              (a, i) => a + i.quantidadePedida,
              0
            )
            const totalRecebido = p.itens.reduce(
              (a, i) => a + i.quantidadeRecebida,
              0
            )
            const podeReceber =
              p.status !== "RECEBIDO" && p.status !== "CANCELADO"

            return (
              <div key={p.id} className="card-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">
                        {p.identificacao}
                      </h2>
                      <PilulaStatus status={p.status} atrasado={atrasado} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {p.fornecedor && `${p.fornecedor} · `}
                      Pedido em {p.dataPedido.toLocaleDateString("pt-BR")} ·
                      Previsto para{" "}
                      <span
                        className={
                          atrasado ? "font-semibold text-destructive" : ""
                        }
                      >
                        {p.dataPrevisaoEntrega.toLocaleDateString("pt-BR")}
                      </span>
                      {p.evento && ` · ${p.evento.nome}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.arteUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        nativeButton={false}
                        render={
                          <a
                            href={p.arteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <FileText className="size-4" /> Arte
                      </Button>
                    )}
                    {podeReceber && (
                      <RecebimentoDialog
                        pedidoId={p.id}
                        identificacao={p.identificacao}
                        itens={p.itens.map((i) => ({
                          id: i.id,
                          modelo: i.modelo.nome,
                          cor: i.cor,
                          tamanho: i.tamanho,
                          quantidadePedida: i.quantidadePedida,
                          quantidadeRecebida: i.quantidadeRecebida,
                        }))}
                        trigger={
                          <Button size="sm" className="rounded-xl">
                            <PackageCheck className="size-4" /> Confirmar
                            recebimento
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.itens.map((i) => (
                    <span
                      key={i.id}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700"
                    >
                      {i.modelo.nome} {i.cor} · <strong>{i.tamanho}</strong> ·{" "}
                      {i.quantidadeRecebida > 0
                        ? `${i.quantidadeRecebida}/${i.quantidadePedida}`
                        : i.quantidadePedida}{" "}
                      un.
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-4">
                  <div>
                    <p className="eyebrow mb-0.5">Peças</p>
                    <p className="text-sm font-semibold">
                      {totalRecebido > 0
                        ? `${totalRecebido} de ${totalPecas}`
                        : totalPecas}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Preço/peça</p>
                    <p className="text-sm font-semibold">
                      {formatarBRL(p.precoPorPeca)}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Valor total</p>
                    <p className="text-sm font-bold">
                      {formatarBRL(p.precoPorPeca * totalPecas)}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Recebimento</p>
                    <p className="text-sm font-semibold">
                      {p.dataRecebimento
                        ? p.dataRecebimento.toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
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
