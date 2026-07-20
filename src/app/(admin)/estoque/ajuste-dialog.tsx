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
import { registrarAjuste } from "@/server/estoque"

type VariacaoOption = { id: string; label: string; estoqueAtual: number }

export function AjusteDialog({
  variacoes,
  trigger,
}: {
  variacoes: VariacaoOption[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    registrarAjuste,
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
          <DialogTitle>Ajuste manual de estoque</DialogTitle>
          <DialogDescription>
            Correções de contagem. A observação é obrigatória e fica na
            trilha de auditoria.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aj-produto">Produto *</Label>
            <NativeSelect id="aj-produto" name="variacaoId" required defaultValue="">
              <option value="" disabled>
                Selecione o produto
              </option>
              {variacoes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} (saldo: {p.estoqueAtual})
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="aj-tipo">Tipo *</Label>
              <NativeSelect id="aj-tipo" name="tipo" required defaultValue="AJUSTE_ENTRADA">
                <option value="AJUSTE_ENTRADA">Entrada (somar)</option>
                <option value="AJUSTE_SAIDA">Saída (subtrair)</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aj-qtd">Quantidade *</Label>
              <Input
                id="aj-qtd"
                name="quantidade"
                type="number"
                min={1}
                step={1}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aj-obs">Observação (obrigatória) *</Label>
            <Textarea
              id="aj-obs"
              name="observacao"
              rows={2}
              placeholder='Ex: "Contagem física divergente"'
              required
            />
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
              Registrar ajuste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
