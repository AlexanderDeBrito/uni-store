"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { estadoInicial } from "@/server/action-state"
import { salvarSetor } from "@/server/setores"

type Setor = {
  id: string
  nome: string
  regiao: string | null
  ativo: boolean
}

export function SetorDialog({
  setor,
  trigger,
}: {
  setor?: Setor
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(salvarSetor, estadoInicial)

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{setor ? "Editar setor" : "Novo setor"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {setor && <input type="hidden" name="id" value={setor.id} />}
          <div className="space-y-2">
            <Label htmlFor="setor-nome">Nome do setor *</Label>
            <Input
              id="setor-nome"
              name="nome"
              defaultValue={setor?.nome}
              placeholder='Ex: "Setor Centro"'
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setor-regiao">Região</Label>
            <Input
              id="setor-regiao"
              name="regiao"
              defaultValue={setor?.regiao ?? ""}
              placeholder="Agrupador opcional"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="setor-ativo"
              name="ativo"
              defaultChecked={setor?.ativo ?? true}
            />
            <Label htmlFor="setor-ativo">Ativo (aparece nos formulários)</Label>
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
