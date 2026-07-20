"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { estadoInicial } from "@/server/action-state"
import { salvarEvento } from "@/server/eventos"

type Evento = {
  id: string
  nome: string
  descricao: string | null
  local: string | null
  dataInicio: string
  dataFim: string | null
  prazoReserva: string | null
  status: string
}

export function EventoDialog({
  evento,
  trigger,
}: {
  evento?: Evento
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(salvarEvento, estadoInicial)

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>
            O evento gera um link público de reserva para os clientes.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {evento && <input type="hidden" name="id" value={evento.id} />}
          <div className="space-y-2">
            <Label htmlFor="ev-nome">Nome do evento *</Label>
            <Input
              id="ev-nome"
              name="nome"
              defaultValue={evento?.nome}
              placeholder='Ex: "Conferência 2026", "Vigília"'
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-desc">Descrição</Label>
            <Textarea
              id="ev-desc"
              name="descricao"
              rows={2}
              defaultValue={evento?.descricao ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-local">Local</Label>
            <Input
              id="ev-local"
              name="local"
              defaultValue={evento?.local ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-inicio">Data de início *</Label>
              <Input
                id="ev-inicio"
                name="dataInicio"
                type="date"
                defaultValue={evento?.dataInicio}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-fim">Data de término</Label>
              <Input
                id="ev-fim"
                name="dataFim"
                type="date"
                defaultValue={evento?.dataFim ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-prazo">Prazo de reservas</Label>
              <Input
                id="ev-prazo"
                name="prazoReserva"
                type="date"
                defaultValue={evento?.prazoReserva ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-status">Status *</Label>
              <NativeSelect
                id="ev-status"
                name="status"
                defaultValue={evento?.status ?? "PLANEJADO"}
                required
              >
                <option value="PLANEJADO">Planejado</option>
                <option value="ATIVO">Ativo</option>
                <option value="ENCERRADO">Encerrado</option>
              </NativeSelect>
            </div>
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
