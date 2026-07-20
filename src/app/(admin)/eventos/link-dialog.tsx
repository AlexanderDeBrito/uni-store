"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Link2, Loader2 } from "lucide-react"
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
import { formatarBRL } from "@/lib/money"
import { estadoInicial } from "@/server/action-state"
import { configurarLinkReserva } from "@/server/eventos"

export type ProdutoLink = {
  id: string
  label: string
  precoVenda: number
  disponivel: number
}

export function LinkDialog({
  eventoId,
  eventoNome,
  produtos,
  selecionadosIniciais,
  prazoInicial,
  trigger,
}: {
  eventoId: string
  eventoNome: string
  produtos: ProdutoLink[]
  selecionadosIniciais: string[]
  prazoInicial: string
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    configurarLinkReserva,
    estadoInicial
  )
  const [selecionados, setSelecionados] = useState<string[]>(selecionadosIniciais)

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
    }
  }, [state])

  function alternar(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5" /> Link de reserva
          </DialogTitle>
          <DialogDescription>
            {eventoNome} — escolha as peças que ficam disponíveis para reserva e
            até quando o link aceita pedidos.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="eventoId" value={eventoId} />

          <div className="space-y-2">
            <Label htmlFor="link-prazo">Link disponível até</Label>
            <Input
              id="link-prazo"
              name="prazoReserva"
              type="datetime-local"
              defaultValue={prazoInicial}
            />
            <p className="text-xs text-neutral-400">
              Depois desta data e hora o link expira automaticamente. Deixe em
              branco para não expirar.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Peças disponíveis para reserva *</Label>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-neutral-200 p-2">
              {produtos.length === 0 && (
                <p className="p-3 text-sm text-neutral-400">
                  Nenhum produto com estoque disponível.
                </p>
              )}
              {produtos.map((p) => {
                const marcado = selecionados.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                      marcado ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="variacaoIds"
                      value={p.id}
                      checked={marcado}
                      onChange={() => alternar(p.id)}
                      className="size-4 accent-neutral-900"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">
                      {p.label}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-neutral-600">
                      {formatarBRL(p.precoVenda)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.disponivel === 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {p.disponivel} disp.
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-neutral-400">
              {selecionados.length} peça
              {selecionados.length === 1 ? "" : "s"} selecionada
              {selecionados.length === 1 ? "" : "s"}
            </p>
          </div>

          {!state.ok && state.message && (
            <p className="text-sm font-medium text-destructive">
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Salvar link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
