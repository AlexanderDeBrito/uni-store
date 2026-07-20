"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { cancelarReserva, confirmarRetirada } from "@/server/reservas"

export function AcoesReserva({
  reservaId,
  codigo,
  estoqueDisponivel,
  quantidade,
}: {
  reservaId: string
  codigo: string
  estoqueDisponivel: number
  quantidade: number
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [forma, setForma] = useState<string>("")

  const semEstoque = estoqueDisponivel < quantidade

  function confirmar() {
    if (!forma) {
      toast.error("Escolha a forma de pagamento efetiva.")
      return
    }
    startTransition(async () => {
      const res = await confirmarRetirada(
        reservaId,
        forma as "CARTAO" | "PIX" | "DINHEIRO"
      )
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  function cancelar() {
    startTransition(async () => {
      const res = await cancelarReserva(reservaId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button size="sm" className="rounded-xl" onClick={() => setOpen(true)}>
          <Check className="size-4" /> Retirar
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cancelar reserva"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={cancelar}
        >
          <X className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar retirada {codigo}</DialogTitle>
            <DialogDescription>
              Registre a forma de pagamento efetiva. O estoque é baixado agora.
            </DialogDescription>
          </DialogHeader>

          {semEstoque && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              Estoque insuficiente: disponível {estoqueDisponivel}, reserva de{" "}
              {quantidade}.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {FORMAS_PAGAMENTO.map((f) => (
              <Button
                key={f.value}
                type="button"
                variant={forma === f.value ? "default" : "outline"}
                onClick={() => setForma(f.value)}
                className="h-11 rounded-xl"
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={pending || semEstoque}>
              {pending && <Loader2 className="animate-spin" />}
              Confirmar retirada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
