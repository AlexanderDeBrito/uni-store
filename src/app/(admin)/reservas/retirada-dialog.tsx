"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatarBRL, parseBRL } from "@/lib/money"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { confirmarRetirada, editarReserva } from "@/server/reservas"

export type ItemRetirada = {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  disponivelExtra: number // quanto ainda dá para aumentar
}

type Forma = "CARTAO" | "PIX" | "DINHEIRO"

export function RetiradaDialog({
  reservaId,
  codigo,
  nome,
  itens,
  trigger,
}: {
  reservaId: string
  codigo: string
  nome: string
  itens: ItemRetirada[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, i.quantidade]))
  )
  const [valores, setValores] = useState<Record<Forma, string>>({
    DINHEIRO: "",
    CARTAO: "",
    PIX: "",
  })

  const total = useMemo(
    () =>
      itens.reduce(
        (acc, i) => acc + i.precoUnitario * (quantidades[i.id] ?? 0),
        0
      ),
    [itens, quantidades]
  )

  const pagamentos = useMemo(
    () =>
      (Object.entries(valores) as [Forma, string][])
        .map(([forma, texto]) => ({ forma, valor: parseBRL(texto) ?? 0 }))
        .filter((p) => p.valor > 0),
    [valores]
  )
  const somaPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0)
  const diferenca = total - somaPagamentos
  const alterou = itens.some((i) => (quantidades[i.id] ?? 0) !== i.quantidade)

  function ajustar(itemId: string, delta: number) {
    const item = itens.find((i) => i.id === itemId)
    if (!item) return
    const maximo = item.quantidade + item.disponivelExtra
    setQuantidades((prev) => ({
      ...prev,
      [itemId]: Math.min(maximo, Math.max(0, (prev[itemId] ?? 0) + delta)),
    }))
  }

  /** Preenche a forma escolhida com tudo que ainda falta. */
  function preencherRestante(forma: Forma) {
    const restante = total - (somaPagamentos - (parseBRL(valores[forma]) ?? 0))
    if (restante <= 0) return
    setValores((prev) => ({
      ...prev,
      [forma]: (restante / 100).toFixed(2).replace(".", ","),
    }))
  }

  function confirmar() {
    if (total === 0) {
      toast.error("A reserva ficou sem peças. Cancele-a em vez de retirar.")
      return
    }
    if (diferenca !== 0) {
      toast.error(
        diferenca > 0
          ? `Faltam ${formatarBRL(diferenca)} para fechar o total.`
          : `Os pagamentos passam ${formatarBRL(-diferenca)} do total.`
      )
      return
    }

    startTransition(async () => {
      // Primeiro grava a mudança de quantidade (10 reservadas, levou 8).
      if (alterou) {
        const edicao = await editarReserva(
          reservaId,
          itens.map((i) => ({
            itemId: i.id,
            quantidade: quantidades[i.id] ?? 0,
          }))
        )
        if (!edicao.ok) {
          toast.error(edicao.message)
          return
        }
      }

      const res = await confirmarRetirada(reservaId, pagamentos)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="size-5" /> Retirada {codigo}
          </DialogTitle>
          <DialogDescription>
            {nome} — ajuste as quantidades se ele levar menos peças e registre
            como pagou. O estoque baixa e a venda é registrada.
          </DialogDescription>
        </DialogHeader>

        {/* Itens com quantidade editável */}
        <div className="space-y-2">
          <Label>Peças</Label>
          {itens.map((item) => {
            const qtd = quantidades[item.id] ?? 0
            const mudou = qtd !== item.quantidade
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {item.descricao}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatarBRL(item.precoUnitario)} cada
                    {mudou && ` · reservou ${item.quantidade}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Diminuir"
                    onClick={() => ajustar(item.id, -1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {qtd}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Aumentar"
                    onClick={() => ajustar(item.id, 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-semibold">
                  {formatarBRL(item.precoUnitario * qtd)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Pagamento dividido */}
        <div className="space-y-2">
          <Label>Pagamento (pode dividir entre as formas)</Label>
          {FORMAS_PAGAMENTO.map((f) => (
            <div key={f.value} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-sm text-neutral-600">
                {f.label}
              </span>
              <Input
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={valores[f.value as Forma]}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    [f.value as Forma]: e.target.value,
                  }))
                }
                aria-label={`Valor em ${f.label}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => preencherRestante(f.value as Forma)}
              >
                Restante
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl bg-neutral-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-widest text-neutral-400 uppercase">
              Total
            </span>
            <span className="text-xl font-bold">{formatarBRL(total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Informado</span>
            <span>{formatarBRL(somaPagamentos)}</span>
          </div>
          {diferenca !== 0 && (
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-neutral-400">
                {diferenca > 0 ? "Falta" : "Excedeu"}
              </span>
              <span className={diferenca > 0 ? "text-amber-300" : "text-red-400"}>
                {formatarBRL(Math.abs(diferenca))}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={pending || diferenca !== 0}>
            {pending && <Loader2 className="animate-spin" />}
            Confirmar retirada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
