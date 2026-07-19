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
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { estadoInicial } from "@/server/action-state"
import { salvarCongregacao } from "@/server/congregacoes"

type Congregacao = {
  id: string
  nome: string
  lider: string
  ativo: boolean
  setorId: string
}

export function CongregacaoDialog({
  setores,
  congregacao,
  trigger,
}: {
  setores: { id: string; nome: string; ativo: boolean }[]
  congregacao?: Congregacao
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    salvarCongregacao,
    estadoInicial
  )

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
          <DialogTitle>
            {congregacao ? "Editar congregação" : "Nova congregação"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {congregacao && (
            <input type="hidden" name="id" value={congregacao.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="cong-setor">Setor *</Label>
            <NativeSelect
              id="cong-setor"
              name="setorId"
              defaultValue={congregacao?.setorId ?? ""}
              required
            >
              <option value="" disabled>
                Selecione o setor
              </option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                  {!s.ativo ? " (inativo)" : ""}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cong-nome">Nome da congregação *</Label>
            <Input
              id="cong-nome"
              name="nome"
              defaultValue={congregacao?.nome}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cong-lider">Nome do Líder de Jovens *</Label>
            <Input
              id="cong-lider"
              name="lider"
              defaultValue={congregacao?.lider}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="cong-ativo"
              name="ativo"
              defaultChecked={congregacao?.ativo ?? true}
            />
            <Label htmlFor="cong-ativo">Ativa (aparece nos formulários)</Label>
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
