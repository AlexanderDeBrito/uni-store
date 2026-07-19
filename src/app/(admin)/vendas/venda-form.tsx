"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { formatarCpf, limparCpf, validarCpf } from "@/lib/cpf"
import { formatarBRL } from "@/lib/money"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { buscarClientePorCpf } from "@/server/clientes"
import { criarVenda, editarVenda, type VendaPayload } from "@/server/vendas"

export type SetorOption = { id: string; nome: string }
export type CongregacaoOption = {
  id: string
  nome: string
  setorId: string
  lider: string
}
export type ProdutoOption = {
  id: string
  label: string
  precoVenda: number
  estoqueAtual: number
}

type ItemForm = { produtoId: string; quantidade: number }

export type VendaInicial = {
  id: string
  cpf: string
  nome: string
  setorId: string
  congregacaoId: string
  liderNome: string
  formaPagamento: string
  observacoes: string
  itens: ItemForm[]
}

export function VendaForm({
  setores,
  congregacoes,
  produtos,
  vendaInicial,
}: {
  setores: SetorOption[]
  congregacoes: CongregacaoOption[]
  produtos: ProdutoOption[]
  vendaInicial?: VendaInicial
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [buscandoCpf, setBuscandoCpf] = useState(false)
  const [recorrente, setRecorrente] = useState(false)

  const [cpf, setCpf] = useState(
    vendaInicial ? formatarCpf(vendaInicial.cpf) : ""
  )
  const [nome, setNome] = useState(vendaInicial?.nome ?? "")
  const [setorId, setSetorId] = useState(vendaInicial?.setorId ?? "")
  const [congregacaoId, setCongregacaoId] = useState(
    vendaInicial?.congregacaoId ?? ""
  )
  const [lider, setLider] = useState(vendaInicial?.liderNome ?? "")
  const [formaPagamento, setFormaPagamento] = useState(
    vendaInicial?.formaPagamento ?? ""
  )
  const [observacoes, setObservacoes] = useState(
    vendaInicial?.observacoes ?? ""
  )
  const [itens, setItens] = useState<ItemForm[]>(
    vendaInicial?.itens ?? [{ produtoId: "", quantidade: 1 }]
  )

  const congregacoesDoSetor = useMemo(
    () => congregacoes.filter((c) => c.setorId === setorId),
    [congregacoes, setorId]
  )

  const total = useMemo(
    () =>
      itens.reduce((acc, item) => {
        const p = produtos.find((x) => x.id === item.produtoId)
        return acc + (p ? p.precoVenda * item.quantidade : 0)
      }, 0),
    [itens, produtos]
  )

  const cpfValido = validarCpf(cpf)

  async function aoConcluirCpf(valor: string) {
    if (!validarCpf(valor)) return
    setBuscandoCpf(true)
    try {
      const cliente = await buscarClientePorCpf(valor)
      if (cliente) {
        setRecorrente(true)
        setNome(cliente.nome)
        if (cliente.setorId) setSetorId(cliente.setorId)
        if (cliente.congregacaoId) setCongregacaoId(cliente.congregacaoId)
        if (cliente.lider) setLider(cliente.lider)
        toast.success("Cliente recorrente — dados preenchidos.")
      } else {
        setRecorrente(false)
      }
    } finally {
      setBuscandoCpf(false)
    }
  }

  function selecionarSetor(id: string) {
    setSetorId(id)
    setCongregacaoId("")
    setLider("")
  }

  function selecionarCongregacao(id: string) {
    setCongregacaoId(id)
    const c = congregacoes.find((x) => x.id === id)
    if (c) setLider(c.lider)
  }

  function atualizarItem(index: number, patch: Partial<ItemForm>) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function enviar() {
    const payload: VendaPayload = {
      cpf: limparCpf(cpf),
      nome: nome.trim(),
      congregacaoId,
      liderNome: lider.trim(),
      formaPagamento: formaPagamento as VendaPayload["formaPagamento"],
      observacoes: observacoes.trim() || undefined,
      itens: itens
        .filter((i) => i.produtoId)
        .map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
    }

    startTransition(async () => {
      const res = vendaInicial
        ? await editarVenda(vendaInicial.id, payload)
        : await criarVenda(payload)
      if (res.ok) {
        toast.success(res.message)
        router.push("/vendas")
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Cliente
            {recorrente && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <UserCheck className="size-4" /> recorrente
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-cpf">CPF *</Label>
            <div className="relative">
              <Input
                id="v-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  const formatado = formatarCpf(e.target.value)
                  setCpf(formatado)
                  aoConcluirCpf(formatado)
                }}
                aria-invalid={cpf.length === 14 && !cpfValido}
              />
              {buscandoCpf && (
                <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {cpf.length === 14 && !cpfValido && (
              <p className="text-sm text-destructive">CPF inválido.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-nome">Nome completo *</Label>
            <Input
              id="v-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-setor">Setor da congregação *</Label>
            <NativeSelect
              id="v-setor"
              value={setorId}
              onChange={(e) => selecionarSetor(e.target.value)}
            >
              <option value="" disabled>
                Selecione o setor
              </option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-cong">Congregação *</Label>
            <NativeSelect
              id="v-cong"
              value={congregacaoId}
              onChange={(e) => selecionarCongregacao(e.target.value)}
              disabled={!setorId}
            >
              <option value="" disabled>
                {setorId ? "Selecione a congregação" : "Escolha o setor antes"}
              </option>
              {congregacoesDoSetor.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="v-lider">Líder de jovens *</Label>
            <Input
              id="v-lider"
              value={lider}
              onChange={(e) => setLider(e.target.value)}
              placeholder="Preenchido pela congregação; pode editar"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {itens.map((item, index) => {
            const produto = produtos.find((p) => p.id === item.produtoId)
            const estoqueBaixo =
              produto && item.quantidade > produto.estoqueAtual
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    {index === 0 && <Label>Produto *</Label>}
                    <NativeSelect
                      value={item.produtoId}
                      onChange={(e) =>
                        atualizarItem(index, { produtoId: e.target.value })
                      }
                      aria-label={`Produto ${index + 1}`}
                    >
                      <option value="" disabled>
                        Selecione o produto
                      </option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} · {formatarBRL(p.precoVenda)} (saldo:{" "}
                          {p.estoqueAtual})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="w-20 space-y-2">
                    {index === 0 && <Label>Qtd. *</Label>}
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(index, {
                          quantidade: Math.max(
                            1,
                            Math.trunc(Number(e.target.value) || 1)
                          ),
                        })
                      }
                      aria-label={`Quantidade do produto ${index + 1}`}
                    />
                  </div>
                  <div className="hidden w-24 pb-2 text-right text-sm font-medium sm:block">
                    {produto
                      ? formatarBRL(produto.precoVenda * item.quantidade)
                      : "—"}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover produto"
                    className="text-muted-foreground"
                    disabled={itens.length === 1}
                    onClick={() =>
                      setItens((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {estoqueBaixo && (
                  <p className="text-sm text-destructive">
                    Estoque insuficiente. Disponível: {produto.estoqueAtual}
                  </p>
                )}
              </div>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItens((prev) => [...prev, { produtoId: "", quantidade: 1 }])
            }
          >
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {FORMAS_PAGAMENTO.map((f) => (
              <Button
                key={f.value}
                type="button"
                variant={formaPagamento === f.value ? "default" : "outline"}
                onClick={() => setFormaPagamento(f.value)}
                className="h-11"
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-obs">Observações</Label>
            <Textarea
              id="v-obs"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-4 border-t bg-white p-4 lg:mx-0 lg:rounded-lg lg:border">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatarBRL(total)}</p>
        </div>
        <Button
          size="lg"
          onClick={enviar}
          disabled={pending}
          className="min-w-40"
        >
          {pending && <Loader2 className="animate-spin" />}
          {vendaInicial ? "Salvar alterações" : "Confirmar venda"}
        </Button>
      </div>
    </div>
  )
}
