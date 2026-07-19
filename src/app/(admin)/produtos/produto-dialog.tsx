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
import { Textarea } from "@/components/ui/textarea"
import { TAMANHOS } from "@/lib/constantes"
import { estadoInicial } from "@/server/action-state"
import { salvarProduto } from "@/server/produtos"

type Produto = {
  id: string
  modelo: string
  cor: string
  tamanho: string
  precoVenda: number
  custoReferencia: number | null
  descricao: string | null
}

function centavosParaInput(v: number | null): string {
  if (v === null) return ""
  return (v / 100).toFixed(2).replace(".", ",")
}

export function ProdutoDialog({
  produto,
  trigger,
}: {
  produto?: Produto
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(salvarProduto, estadoInicial)

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
            {produto ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {produto && <input type="hidden" name="id" value={produto.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prod-modelo">Modelo *</Label>
              <Input
                id="prod-modelo"
                name="modelo"
                defaultValue={produto?.modelo}
                placeholder='Ex: "Camiseta"'
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-cor">Cor *</Label>
              <Input
                id="prod-cor"
                name="cor"
                defaultValue={produto?.cor}
                placeholder='Ex: "Bordô"'
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prod-tamanho">Tamanho *</Label>
              <NativeSelect
                id="prod-tamanho"
                name="tamanho"
                defaultValue={produto?.tamanho ?? ""}
                required
              >
                <option value="" disabled>
                  —
                </option>
                {TAMANHOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-preco">Preço de venda *</Label>
              <Input
                id="prod-preco"
                name="precoVenda"
                inputMode="decimal"
                placeholder="R$ 0,00"
                defaultValue={centavosParaInput(produto?.precoVenda ?? null)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-custo">Custo ref.</Label>
              <Input
                id="prod-custo"
                name="custoReferencia"
                inputMode="decimal"
                placeholder="R$ 0,00"
                defaultValue={centavosParaInput(
                  produto?.custoReferencia ?? null
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-descricao">Descrição</Label>
            <Textarea
              id="prod-descricao"
              name="descricao"
              rows={2}
              defaultValue={produto?.descricao ?? ""}
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
