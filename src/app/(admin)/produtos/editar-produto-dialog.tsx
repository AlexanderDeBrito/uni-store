"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { UploadArquivo } from "@/components/upload-arquivo"
import { TAMANHOS } from "@/lib/constantes"
import { descreverVariacao } from "@/lib/produto"
import { estadoInicial } from "@/server/action-state"
import { adicionarVariacao, atualizarProduto } from "@/server/produtos"
import type { ProdutoCard } from "./card-produto"

function centavosParaInput(v: number | null): string {
  if (v === null) return ""
  return (v / 100).toFixed(2).replace(".", ",")
}

export function EditarProdutoDialog({
  produto,
  modelos,
  uploadDisponivel,
  trigger,
}: {
  produto: ProdutoCard
  modelos: { id: string; nome: string }[]
  uploadDisponivel: boolean
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    atualizarProduto,
    estadoInicial
  )
  const [novaState, novaAction, novaPending] = useActionState(
    adicionarVariacao,
    estadoInicial
  )

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
    }
  }, [state])

  useEffect(() => {
    if (novaState.ok && novaState.message) toast.success(novaState.message)
    if (!novaState.ok && novaState.message) toast.error(novaState.message)
  }, [novaState])

  const usaTamanho = produto.categoria === "VESTUARIO"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {produto.nome}</DialogTitle>
          <DialogDescription>
            Alterações de estoque são feitas em Estoque; aqui ficam os dados do
            produto.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={produto.id} />

          <div className="space-y-2">
            <Label htmlFor="e-nome">Nome do produto *</Label>
            <Input id="e-nome" name="nome" defaultValue={produto.nome} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-preco">Preço de venda *</Label>
              <Input
                id="e-preco"
                name="precoVenda"
                inputMode="decimal"
                defaultValue={centavosParaInput(produto.precoVenda)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-custo">Custo de referência</Label>
              <Input
                id="e-custo"
                name="custoReferencia"
                inputMode="decimal"
                defaultValue={centavosParaInput(produto.custoReferencia)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-modelo">Modelo</Label>
            <NativeSelect
              id="e-modelo"
              name="modeloId"
              defaultValue={produto.modeloId ?? ""}
            >
              <option value="">Sem modelo</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-descricao">Descrição</Label>
            <Textarea
              id="e-descricao"
              name="descricao"
              rows={2}
              defaultValue={produto.descricao ?? ""}
            />
          </div>

          <UploadArquivo
            pasta="produtos"
            rotulo="Imagem do produto"
            campoUrl="imagemUrl"
            campoNome="imagemNome"
            campoTipo="imagemTipo"
            disponivel={uploadDisponivel}
            arquivoAtual={produto.imagemNome}
          />

          <div className="flex items-center gap-3">
            <Switch id="e-ativo" name="ativo" defaultChecked={produto.ativo} />
            <Label htmlFor="e-ativo">Ativo</Label>
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

        {/* Nova variação */}
        <div className="mt-2 border-t border-neutral-100 pt-4">
          <p className="eyebrow mb-2">Variações atuais</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {produto.variacoes.map((v) => (
              <span
                key={v.id}
                className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
              >
                {descreverVariacao(v)} · {v.estoqueAtual}
              </span>
            ))}
          </div>

          <form action={novaAction} className="flex items-end gap-2">
            <input type="hidden" name="produtoId" value={produto.id} />
            <div className="flex-1 space-y-1">
              <span className="text-xs text-neutral-400">Cor</span>
              <Input name="cor" placeholder="Bordô" />
            </div>
            {usaTamanho && (
              <div className="w-24 space-y-1">
                <span className="text-xs text-neutral-400">Tamanho</span>
                <NativeSelect name="tamanho" defaultValue="M">
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <div className="w-20 space-y-1">
              <span className="text-xs text-neutral-400">Qtd.</span>
              <Input name="quantidade" type="number" min={0} defaultValue={0} />
            </div>
            <Button type="submit" variant="outline" disabled={novaPending}>
              {novaPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
