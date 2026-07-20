"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { TAMANHOS } from "@/lib/constantes"
import { formatarBRL, parseBRL } from "@/lib/money"
import { estadoInicial } from "@/server/action-state"
import { criarPedido } from "@/server/pedidos-producao"

type Item = {
  modeloId: string
  cor: string
  tamanho: string
  quantidadePedida: number
}

export function PedidoDialog({
  modelos,
  eventos,
  trigger,
  uploadDisponivel,
}: {
  modelos: { id: string; nome: string }[]
  eventos: { id: string; nome: string }[]
  trigger: React.ReactElement
  uploadDisponivel: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(criarPedido, estadoInicial)

  const [precoPorPeca, setPrecoPorPeca] = useState("")
  const [itens, setItens] = useState<Item[]>([
    { modeloId: "", cor: "", tamanho: "M", quantidadePedida: 1 },
  ])

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
      setItens([{ modeloId: "", cor: "", tamanho: "M", quantidadePedida: 1 }])
      setPrecoPorPeca("")
    }
  }, [state])

  const totalPecas = useMemo(
    () => itens.reduce((acc, i) => acc + (i.quantidadePedida || 0), 0),
    [itens]
  )
  const valorTotal = useMemo(() => {
    const preco = parseBRL(precoPorPeca)
    return preco === null ? 0 : preco * totalPecas
  }, [precoPorPeca, totalPecas])

  function atualizar(index: number, patch: Partial<Item>) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo pedido de produção</DialogTitle>
          <DialogDescription>
            Registre a encomenda à fábrica. Ao confirmar o recebimento, as peças
            entram no estoque automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="itens" value={JSON.stringify(itens)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ped-id">Identificação do pedido *</Label>
              <Input
                id="ped-id"
                name="identificacao"
                placeholder='Ex: "Lote Conferência 2026"'
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ped-fornecedor">Fornecedor</Label>
              <Input
                id="ped-fornecedor"
                name="fornecedor"
                placeholder="Fábrica que vai produzir"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ped-data">Data do pedido *</Label>
              <Input
                id="ped-data"
                name="dataPedido"
                type="date"
                defaultValue={hoje}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ped-previsao">Previsão de recebimento *</Label>
              <Input
                id="ped-previsao"
                name="dataPrevisaoEntrega"
                type="date"
                required
              />
            </div>
            {eventos.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ped-evento">Evento vinculado</Label>
                <NativeSelect id="ped-evento" name="eventoId" defaultValue="">
                  <option value="">Nenhum</option>
                  {eventos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="space-y-3">
            <Label>Itens do pedido *</Label>
            {itens.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-neutral-400">Modelo</span>
                  <NativeSelect
                    value={item.modeloId}
                    onChange={(e) =>
                      atualizar(index, { modeloId: e.target.value })
                    }
                    aria-label={`Modelo do item ${index + 1}`}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {modelos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="w-28 space-y-1">
                  <span className="text-xs text-neutral-400">Cor</span>
                  <Input
                    value={item.cor}
                    onChange={(e) => atualizar(index, { cor: e.target.value })}
                    placeholder="Bordô"
                    aria-label={`Cor do item ${index + 1}`}
                  />
                </div>
                <div className="w-24 space-y-1">
                  <span className="text-xs text-neutral-400">Tam.</span>
                  <NativeSelect
                    value={item.tamanho}
                    onChange={(e) =>
                      atualizar(index, { tamanho: e.target.value })
                    }
                    aria-label={`Tamanho do item ${index + 1}`}
                  >
                    {TAMANHOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="w-20 space-y-1">
                  <span className="text-xs text-neutral-400">Qtd.</span>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantidadePedida}
                    onChange={(e) =>
                      atualizar(index, {
                        quantidadePedida: Math.max(
                          1,
                          Math.trunc(Number(e.target.value) || 1)
                        ),
                      })
                    }
                    aria-label={`Quantidade do item ${index + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover item"
                  disabled={itens.length === 1}
                  onClick={() =>
                    setItens((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setItens((prev) => [
                  ...prev,
                  {
                    modeloId: prev[prev.length - 1]?.modeloId ?? "",
                    cor: prev[prev.length - 1]?.cor ?? "",
                    tamanho: "M",
                    quantidadePedida: 1,
                  },
                ])
              }
            >
              <Plus className="size-4" /> Adicionar tamanho/item
            </Button>
          </div>

          {/* Valores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ped-preco">Preço por peça *</Label>
              <Input
                id="ped-preco"
                name="precoPorPeca"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={precoPorPeca}
                onChange={(e) => setPrecoPorPeca(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ped-venda">Preço de venda sugerido</Label>
              <Input
                id="ped-venda"
                name="precoVendaSugerido"
                inputMode="decimal"
                placeholder="R$ 0,00"
              />
              <p className="text-xs text-neutral-400">
                Usado ao criar produtos novos no recebimento.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-neutral-950 p-4 text-white">
            <div>
              <p className="text-xs tracking-widest text-neutral-400 uppercase">
                Total de peças
              </p>
              <p className="text-xl font-bold">{totalPecas}</p>
            </div>
            <div className="text-right">
              <p className="text-xs tracking-widest text-neutral-400 uppercase">
                Valor total
              </p>
              <p className="text-2xl font-bold">{formatarBRL(valorTotal)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ped-arte">Arte da peça (PNG, JPEG ou PDF)</Label>
            <Input
              id="ped-arte"
              name="arte"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={!uploadDisponivel}
              className="file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm"
            />
            {!uploadDisponivel && (
              <p className="text-xs text-destructive">
                Upload indisponível: falta configurar SUPABASE_SERVICE_ROLE_KEY.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ped-obs">Observações</Label>
            <Textarea id="ped-obs" name="observacoes" rows={2} />
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
              Registrar pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
