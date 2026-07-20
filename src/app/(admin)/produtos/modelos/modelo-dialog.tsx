"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { estadoInicial } from "@/server/action-state"
import { salvarModelo } from "@/server/modelos"

type Modelo = {
  id: string
  nome: string
  descricao: string | null
  arquivoNome: string | null
  ativo: boolean
}

export function ModeloDialog({
  modelo,
  trigger,
  uploadDisponivel,
}: {
  modelo?: Modelo
  trigger: React.ReactElement
  uploadDisponivel: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(salvarModelo, estadoInicial)

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
          <DialogTitle>{modelo ? "Editar modelo" : "Novo modelo"}</DialogTitle>
          <DialogDescription>
            O modelo é reutilizado em produtos e pedidos — cadastre uma vez e
            selecione sempre.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {modelo && <input type="hidden" name="id" value={modelo.id} />}
          <div className="space-y-2">
            <Label htmlFor="mod-nome">Nome do modelo *</Label>
            <Input
              id="mod-nome"
              name="nome"
              defaultValue={modelo?.nome}
              placeholder='Ex: "Camiseta Conferência 2026"'
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mod-descricao">Descrição</Label>
            <Textarea
              id="mod-descricao"
              name="descricao"
              rows={2}
              defaultValue={modelo?.descricao ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mod-arquivo">
              Arte do modelo (PNG, JPEG ou PDF)
            </Label>
            <Input
              id="mod-arquivo"
              name="arquivo"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={!uploadDisponivel}
              className="file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm"
            />
            {modelo?.arquivoNome && (
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Upload className="size-3" /> Atual: {modelo.arquivoNome} —
                enviar outro substitui.
              </p>
            )}
            {!uploadDisponivel && (
              <p className="text-xs text-destructive">
                Upload indisponível: falta configurar SUPABASE_SERVICE_ROLE_KEY.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="mod-ativo"
              name="ativo"
              defaultChecked={modelo?.ativo ?? true}
            />
            <Label htmlFor="mod-ativo">Ativo</Label>
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
