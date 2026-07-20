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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { UploadArquivo } from "@/components/upload-arquivo"
import { TAMANHOS } from "@/lib/constantes"
import { CATEGORIAS, categoria as infoCategoria, porcoesDeLitros } from "@/lib/produto"
import { cn } from "@/lib/utils"
import { estadoInicial } from "@/server/action-state"
import { criarProduto } from "@/server/produtos"

type VariacaoForm = { cor: string; tamanho: string; quantidade: number }

export function ProdutoDialog({
  modelos,
  uploadDisponivel,
  trigger,
}: {
  modelos: { id: string; nome: string }[]
  uploadDisponivel: boolean
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(criarProduto, estadoInicial)

  const [cat, setCat] = useState<string>("VESTUARIO")
  const [variacoes, setVariacoes] = useState<VariacaoForm[]>([
    { cor: "", tamanho: "M", quantidade: 0 },
  ])
  // Categorias sem variação usam um único par cor/quantidade
  const [corSimples, setCorSimples] = useState("")
  const [qtdSimples, setQtdSimples] = useState(0)
  // Alimentos por volume
  const [unidade, setUnidade] = useState("UNIDADE")
  const [litros, setLitros] = useState(0)
  const [ml, setMl] = useState(200)

  const info = infoCategoria(cat)
  const usaVariacoes = info?.usaVariacoes ?? false
  const porcoes = useMemo(() => porcoesDeLitros(litros, ml), [litros, ml])

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      setOpen(false)
      setVariacoes([{ cor: "", tamanho: "M", quantidade: 0 }])
      setCorSimples("")
      setQtdSimples(0)
      setLitros(0)
    }
  }, [state])

  // O que vai para o servidor como lista de variações
  const payloadVariacoes: VariacaoForm[] = usaVariacoes
    ? variacoes
    : [
        {
          cor: cat === "ACESSORIO" ? corSimples : "",
          tamanho: "",
          quantidade:
            cat === "ALIMENTO" && unidade === "LITRO" ? porcoes : qtdSimples,
        },
      ]

  function atualizar(index: number, patch: Partial<VariacaoForm>) {
    setVariacoes((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            A categoria define os campos. A quantidade informada aqui já entra
            no estoque.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="categoria" value={cat} />
          <input type="hidden" name="unidadeMedida" value={unidade} />
          <input
            type="hidden"
            name="variacoes"
            value={JSON.stringify(payloadVariacoes)}
          />

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCat(c.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    cat === c.value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  <span className="block text-sm font-semibold">{c.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px] leading-tight",
                      cat === c.value ? "text-neutral-300" : "text-neutral-400"
                    )}
                  >
                    {c.descricao}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-nome">Nome do produto *</Label>
              <Input
                id="p-nome"
                name="nome"
                placeholder='Ex: "Camiseta Conferência 2026"'
                required
              />
            </div>

            {info?.usaModelo !== "nao" && (
              <div className="space-y-2">
                <Label htmlFor="p-modelo">
                  Modelo {info?.usaModelo === "obrigatorio" && "*"}
                </Label>
                <NativeSelect
                  id="p-modelo"
                  name="modeloId"
                  defaultValue=""
                  required={info?.usaModelo === "obrigatorio"}
                >
                  <option value="">
                    {info?.usaModelo === "obrigatorio"
                      ? "Selecione o modelo"
                      : "Sem modelo"}
                  </option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="p-preco">Preço de venda *</Label>
              <Input
                id="p-preco"
                name="precoVenda"
                inputMode="decimal"
                placeholder="R$ 0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-custo">Custo de referência</Label>
              <Input
                id="p-custo"
                name="custoReferencia"
                inputMode="decimal"
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Vestuário: várias cores/tamanhos/quantidades */}
          {usaVariacoes && (
            <div className="space-y-3">
              <div>
                <Label>Cores, tamanhos e quantidades *</Label>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Cadastre todas as combinações de uma vez — cada linha vira uma
                  variação com seu próprio estoque.
                </p>
              </div>
              {variacoes.map((v, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {index === 0 && (
                      <span className="text-xs text-neutral-400">Cor</span>
                    )}
                    <Input
                      value={v.cor}
                      onChange={(e) => atualizar(index, { cor: e.target.value })}
                      placeholder="Bordô"
                      aria-label={`Cor da variação ${index + 1}`}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    {index === 0 && (
                      <span className="text-xs text-neutral-400">Tamanho</span>
                    )}
                    <NativeSelect
                      value={v.tamanho}
                      onChange={(e) =>
                        atualizar(index, { tamanho: e.target.value })
                      }
                      aria-label={`Tamanho da variação ${index + 1}`}
                    >
                      {TAMANHOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="w-24 space-y-1">
                    {index === 0 && (
                      <span className="text-xs text-neutral-400">Qtd.</span>
                    )}
                    <Input
                      type="number"
                      min={0}
                      value={v.quantidade}
                      onChange={(e) =>
                        atualizar(index, {
                          quantidade: Math.max(
                            0,
                            Math.trunc(Number(e.target.value) || 0)
                          ),
                        })
                      }
                      aria-label={`Quantidade da variação ${index + 1}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover variação"
                    disabled={variacoes.length === 1}
                    onClick={() =>
                      setVariacoes((prev) => prev.filter((_, i) => i !== index))
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
                  setVariacoes((prev) => [
                    ...prev,
                    {
                      cor: prev[prev.length - 1]?.cor ?? "",
                      tamanho: "M",
                      quantidade: 0,
                    },
                  ])
                }
              >
                <Plus className="size-4" /> Adicionar cor/tamanho
              </Button>
            </div>
          )}

          {/* Acessório / Institucional: cor opcional + quantidade */}
          {!usaVariacoes && cat !== "ALIMENTO" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cat === "ACESSORIO" && (
                <div className="space-y-2">
                  <Label htmlFor="p-cor">Cor</Label>
                  <Input
                    id="p-cor"
                    value={corSimples}
                    onChange={(e) => setCorSimples(e.target.value)}
                    placeholder="opcional"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="p-qtd">Quantidade *</Label>
                <Input
                  id="p-qtd"
                  type="number"
                  min={0}
                  value={qtdSimples}
                  onChange={(e) =>
                    setQtdSimples(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
                  }
                />
              </div>
            </div>
          )}

          {/* Alimento: unidade ou litros com cálculo por copo */}
          {cat === "ALIMENTO" && (
            <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
              <div className="space-y-2">
                <Label htmlFor="p-unidade">Tipo de quantidade *</Label>
                <NativeSelect
                  id="p-unidade"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                >
                  <option value="UNIDADE">
                    Unidade (garrafa, lata, barra)
                  </option>
                  <option value="LITRO">Litros (café, chocolate quente)</option>
                </NativeSelect>
              </div>

              {unidade === "UNIDADE" ? (
                <div className="space-y-2">
                  <Label htmlFor="p-qtd-alim">Quantidade *</Label>
                  <Input
                    id="p-qtd-alim"
                    type="number"
                    min={0}
                    value={qtdSimples}
                    onChange={(e) =>
                      setQtdSimples(
                        Math.max(0, Math.trunc(Number(e.target.value) || 0))
                      )
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="p-litros">Total em litros *</Label>
                      <Input
                        id="p-litros"
                        type="number"
                        min={0}
                        step="0.1"
                        value={litros}
                        onChange={(e) =>
                          setLitros(Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-ml">Tamanho do copo (ml) *</Label>
                      <Input
                        id="p-ml"
                        name="mlPorPorcao"
                        type="number"
                        min={1}
                        value={ml}
                        onChange={(e) =>
                          setMl(Math.max(1, Math.trunc(Number(e.target.value) || 1)))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-950 px-4 py-3 text-white">
                    <span className="text-xs tracking-widest text-neutral-400 uppercase">
                      Porções calculadas
                    </span>
                    <span className="text-xl font-bold">{porcoes}</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {litros} L ÷ {ml} ml = {porcoes} copos, que entram no estoque.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="p-descricao">Descrição</Label>
            <Textarea id="p-descricao" name="descricao" rows={2} />
          </div>

          <UploadArquivo
            pasta="produtos"
            rotulo="Imagem do produto (PNG, JPEG ou PDF)"
            campoUrl="imagemUrl"
            campoNome="imagemNome"
            campoTipo="imagemTipo"
            disponivel={uploadDisponivel}
          />
          <p className="-mt-1 text-xs text-neutral-400">
            Sem imagem própria, o card usa a arte do modelo.
          </p>

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
              Cadastrar produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
