"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, PackageCheck } from "lucide-react"
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
import { confirmarRecebimento } from "@/server/pedidos-producao"

export type ItemRecebimento = {
  id: string
  modelo: string
  cor: string
  tamanho: string
  quantidadePedida: number
  quantidadeRecebida: number
}

export function RecebimentoDialog({
  pedidoId,
  identificacao,
  itens,
  trigger,
}: {
  pedidoId: string
  identificacao: string
  itens: ItemRecebimento[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  // Pré-preenche com o que foi pedido — o normal é chegar tudo.
  const [valores, setValores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      itens.map((i) => [
        i.id,
        i.quantidadeRecebida > 0 ? i.quantidadeRecebida : i.quantidadePedida,
      ])
    )
  )

  function confirmar() {
    startTransition(async () => {
      const res = await confirmarRecebimento(
        pedidoId,
        itens.map((i) => ({
          itemId: i.id,
          quantidadeRecebida: valores[i.id] ?? 0,
        }))
      )
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  const totalRecebido = itens.reduce((acc, i) => acc + (valores[i.id] ?? 0), 0)
  const totalPedido = itens.reduce((acc, i) => acc + i.quantidadePedida, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5" /> Confirmar recebimento
          </DialogTitle>
          <DialogDescription>
            {identificacao} — informe quanto chegou de cada tamanho. As peças
            entram no estoque imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {itens.map((item) => {
            const valor = valores[item.id] ?? 0
            const divergente = valor !== item.quantidadePedida
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-neutral-900"
                    title={`${item.modelo} ${item.cor} — ${item.tamanho}`}
                  >
                    {item.modelo} {item.cor} — {item.tamanho}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Pedido: {item.quantidadePedida}
                    {item.quantidadeRecebida > 0 &&
                      ` · já recebido: ${item.quantidadeRecebida}`}
                  </p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={item.quantidadeRecebida}
                    value={valor}
                    onChange={(e) =>
                      setValores((prev) => ({
                        ...prev,
                        [item.id]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    aria-label={`Recebido de ${item.modelo} ${item.tamanho}`}
                    className={divergente ? "border-neutral-900" : ""}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 text-sm">
          <span className="text-neutral-500">Total recebido</span>
          <span className="font-bold text-neutral-900">
            {totalRecebido} de {totalPedido} peças
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Confirmar e lançar no estoque
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
