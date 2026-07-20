"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarDays, Pencil, Receipt } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatarBRL } from "@/lib/money"
import { formatarCpf } from "@/lib/cpf"
import { labelFormaPagamento } from "@/lib/constantes"
import { ExcluirVendaButton } from "./excluir-venda"

export type VendaLinha = {
  id: string
  data: string
  clienteNome: string
  cpf: string | null
  congregacao: string | null
  setor: string | null
  lider: string | null
  evento: string | null
  formaPagamento: string
  total: number
  lucroTotal: number | null
  observacoes: string | null
  itens: {
    descricao: string
    quantidade: number
    precoUnitario: number
    subtotal: number
  }[]
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="eyebrow mb-0.5">{rotulo}</p>
      <p className="text-sm text-neutral-800">{valor}</p>
    </div>
  )
}

export function VendasTabela({ vendas }: { vendas: VendaLinha[] }) {
  const [selecionada, setSelecionada] = useState<VendaLinha | null>(null)

  return (
    <>
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th-label pl-6">Data</th>
                <th className="th-label">Cliente</th>
                <th className="th-label hidden lg:table-cell">Congregação</th>
                <th className="th-label hidden md:table-cell">Itens</th>
                <th className="th-label">Pagamento</th>
                <th className="th-label text-right">Total</th>
                <th className="th-label hidden text-right sm:table-cell">
                  Lucro
                </th>
                <th className="th-label pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vendas.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
              {vendas.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelecionada(v)}
                  className="cursor-pointer transition-colors hover:bg-neutral-50/60"
                  title="Clique para ver os detalhes"
                >
                  <td className="px-4 py-4 pl-6 text-sm font-medium whitespace-nowrap text-neutral-400">
                    {v.data}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                        {v.clienteNome.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {v.clienteNome}
                        </p>
                        {v.cpf && (
                          <p className="text-xs text-neutral-400">
                            {formatarCpf(v.cpf)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-500 lg:table-cell">
                    {v.congregacao ?? "—"}
                  </td>
                  <td className="hidden max-w-52 truncate px-4 py-4 text-sm text-neutral-600 md:table-cell">
                    {v.itens
                      .map((i) => `${i.quantidade}× ${i.descricao}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                      {labelFormaPagamento(v.formaPagamento)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-neutral-900">
                    {formatarBRL(v.total)}
                  </td>
                  <td className="hidden px-4 py-4 text-right text-sm sm:table-cell">
                    {v.lucroTotal === null ? (
                      <span className="text-neutral-300" title="Sem custo registrado">
                        n/c
                      </span>
                    ) : (
                      <span className="font-medium text-neutral-700">
                        {formatarBRL(v.lucroTotal)}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-4 pr-6 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar venda"
                        nativeButton={false}
                        render={<Link href={`/vendas/${v.id}/editar`} />}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ExcluirVendaButton vendaId={v.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={selecionada !== null}
        onOpenChange={(aberto) => !aberto && setSelecionada(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="size-5" /> Detalhes da venda
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Campo rotulo="Cliente" valor={selecionada.clienteNome} />
                  <Campo
                    rotulo="CPF"
                    valor={
                      selecionada.cpf ? formatarCpf(selecionada.cpf) : "não informado"
                    }
                  />
                  <Campo rotulo="Data" valor={selecionada.data} />
                  <Campo
                    rotulo="Pagamento"
                    valor={labelFormaPagamento(selecionada.formaPagamento)}
                  />
                  <Campo
                    rotulo="Congregação"
                    valor={selecionada.congregacao ?? "não informada"}
                  />
                  <Campo
                    rotulo="Setor"
                    valor={selecionada.setor ?? "não informado"}
                  />
                  {selecionada.lider && (
                    <Campo rotulo="Líder" valor={selecionada.lider} />
                  )}
                  {selecionada.evento && (
                    <div>
                      <p className="eyebrow mb-0.5">Evento</p>
                      <p className="flex items-center gap-1.5 text-sm text-neutral-800">
                        <CalendarDays className="size-3.5" />
                        {selecionada.evento}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="eyebrow mb-2">Itens</p>
                  <div className="overflow-hidden rounded-xl border border-neutral-200">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-neutral-100">
                        {selecionada.itens.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2.5 text-neutral-800">
                              {item.descricao}
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap text-neutral-500">
                              {item.quantidade} × {formatarBRL(item.precoUnitario)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                              {formatarBRL(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selecionada.observacoes && (
                  <Campo rotulo="Observações" valor={selecionada.observacoes} />
                )}

                <div className="flex items-end justify-between rounded-xl bg-neutral-950 p-4 text-white">
                  <div>
                    <p className="text-xs tracking-widest text-neutral-400 uppercase">
                      Total
                    </p>
                    <p className="text-2xl font-bold">
                      {formatarBRL(selecionada.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tracking-widest text-neutral-400 uppercase">
                      Lucro
                    </p>
                    <p className="text-lg font-semibold">
                      {selecionada.lucroTotal === null
                        ? "não calculado"
                        : formatarBRL(selecionada.lucroTotal)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/vendas/${selecionada.id}/editar`} />}
                >
                  <Pencil className="size-4" /> Editar venda
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
