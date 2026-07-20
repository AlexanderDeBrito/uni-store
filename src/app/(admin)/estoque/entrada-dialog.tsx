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
import { registrarEntrada } from "@/server/estoque"

type VariacaoOption = { id: string; label: string; estoqueAtual: number }

export function EntradaDialog({
  variacoes,
  trigger,
}: {
  variacoes: VariacaoOption[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    registrarEntrada,
    estadoInicial
  )

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
    }
  }, [state])

  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar entrada de produção</DialogTitle>
          <DialogDescription>
            Produtos recebidos da fábrica, com o custo unitário do lote.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ent-produto">Produto *</Label>
            <NativeSelect id="ent-produto" name="variacaoId" required defaultValue="">
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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ent-qtd">Quantidade *</Label>
              <Input
                id="ent-qtd"
                name="quantidade"
                type="number"
                min={1}
                step={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ent-custo">Custo unit. *</Label>
              <Input
                id="ent-custo"
                name="custoUnitario"
                inputMode="decimal"
                placeholder="R$ 0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ent-data">Data *</Label>
              <Input
                id="ent-data"
                name="data"
                type="date"
                defaultValue={hoje}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ent-obs">Observações</Label>
            <Textarea
              id="ent-obs"
              name="observacao"
              rows={2}
              placeholder='Ex: "Chegou da Grace"'
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
              Registrar entrada
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
