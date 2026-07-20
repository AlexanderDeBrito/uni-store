"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, Loader2, Plus, Trash2, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { formatarCpf, limparCpf, validarCpf } from "@/lib/cpf"
import { formatarBRL } from "@/lib/money"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { descreverVariacao } from "@/lib/produto"
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
  nome: string
  precoVenda: number
  variacoes: {
    id: string
    cor: string
    tamanho: string
    disponivel: number
  }[]
}
export type EventoOption = { id: string; nome: string }

type ItemForm = { produtoId: string; variacaoId: string; quantidade: number }

export type VendaInicial = {
  id: string
  cpf: string
  nome: string
  setorId: string
  congregacaoId: string
  liderNome: string
  eventoId: string
  formaPagamento: string
  observacoes: string
  itens: { variacaoId: string; quantidade: number }[]
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="card-surface p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-neutral-900">{titulo}</h2>
        {descricao && (
          <p className="mt-0.5 text-xs text-neutral-400">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export function VendaForm({
  setores,
  congregacoes,
  produtos,
  eventos,
  vendaInicial,
}: {
  setores: SetorOption[]
  congregacoes: CongregacaoOption[]
  produtos: ProdutoOption[]
  eventos: EventoOption[]
  vendaInicial?: VendaInicial
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [buscandoCpf, setBuscandoCpf] = useState(false)
  const [recorrente, setRecorrente] = useState(false)

  const [cpf, setCpf] = useState(
    vendaInicial?.cpf ? formatarCpf(vendaInicial.cpf) : ""
  )
  const [nome, setNome] = useState(vendaInicial?.nome ?? "")
  const [setorId, setSetorId] = useState(vendaInicial?.setorId ?? "")
  const [congregacaoId, setCongregacaoId] = useState(
    vendaInicial?.congregacaoId ?? ""
  )
  const [lider, setLider] = useState(vendaInicial?.liderNome ?? "")
  const [eventoId, setEventoId] = useState(vendaInicial?.eventoId ?? "")
  const [formaPagamento, setFormaPagamento] = useState(
    vendaInicial?.formaPagamento ?? ""
  )
  const [observacoes, setObservacoes] = useState(vendaInicial?.observacoes ?? "")

  // Reconstrói produto+variação a partir dos itens salvos.
  const [itens, setItens] = useState<ItemForm[]>(() => {
    if (!vendaInicial) return [{ produtoId: "", variacaoId: "", quantidade: 1 }]
    return vendaInicial.itens.map((i) => ({
      produtoId:
        produtos.find((p) => p.variacoes.some((v) => v.id === i.variacaoId))
          ?.id ?? "",
      variacaoId: i.variacaoId,
      quantidade: i.quantidade,
    }))
  })

  const congregacoesDoSetor = useMemo(
    () => congregacoes.filter((c) => c.setorId === setorId),
    [congregacoes, setorId]
  )

  function variacaoDe(item: ItemForm) {
    const produto = produtos.find((p) => p.id === item.produtoId)
    return produto?.variacoes.find((v) => v.id === item.variacaoId)
  }

  const total = useMemo(
    () =>
      itens.reduce((acc, item) => {
        const p = produtos.find((x) => x.id === item.produtoId)
        return acc + (p && item.variacaoId ? p.precoVenda * item.quantidade : 0)
      }, 0),
    [itens, produtos]
  )

  const cpfPreenchido = cpf.replace(/\D/g, "").length > 0
  const cpfValido = !cpfPreenchido || validarCpf(cpf)

  const itemSemEstoque = itens.some((item) => {
    const v = variacaoDe(item)
    return v ? item.quantidade > v.disponivel : false
  })

  const podeEnviar =
    nome.trim().length > 0 &&
    formaPagamento !== "" &&
    itens.some((i) => i.variacaoId) &&
    cpfValido &&
    !itemSemEstoque

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
      nome: nome.trim(),
      cpf: cpfPreenchido ? limparCpf(cpf) : undefined,
      congregacaoId: congregacaoId || undefined,
      liderNome: lider.trim() || undefined,
      eventoId: eventoId || undefined,
      formaPagamento: formaPagamento as VendaPayload["formaPagamento"],
      observacoes: observacoes.trim() || undefined,
      itens: itens
        .filter((i) => i.variacaoId)
        .map((i) => ({ variacaoId: i.variacaoId, quantidade: i.quantidade })),
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
      <Secao
        titulo="Cliente"
        descricao="Só o nome é obrigatório — CPF, setor e congregação são opcionais"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-nome">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="v-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-cpf" className="flex items-center gap-2">
              CPF
              {recorrente && (
                <span className="flex items-center gap-1 text-xs font-normal text-neutral-500">
                  <UserCheck className="size-3.5" /> recorrente
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="v-cpf"
                inputMode="numeric"
                placeholder="opcional"
                value={cpf}
                onChange={(e) => {
                  const formatado = formatarCpf(e.target.value)
                  setCpf(formatado)
                  aoConcluirCpf(formatado)
                }}
                aria-invalid={!cpfValido}
              />
              {buscandoCpf && (
                <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
              )}
            </div>
            {!cpfValido && (
              <p className="text-sm text-destructive">CPF inválido.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-setor">Setor da congregação</Label>
            <NativeSelect
              id="v-setor"
              value={setorId}
              onChange={(e) => selecionarSetor(e.target.value)}
            >
              <option value="">Não informar</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-cong">Congregação</Label>
            <NativeSelect
              id="v-cong"
              value={congregacaoId}
              onChange={(e) => selecionarCongregacao(e.target.value)}
              disabled={!setorId}
            >
              <option value="">
                {setorId ? "Não informar" : "Escolha o setor antes"}
              </option>
              {congregacoesDoSetor.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="v-lider">Líder de jovens</Label>
            <Input
              id="v-lider"
              value={lider}
              onChange={(e) => setLider(e.target.value)}
              placeholder="Preenchido pela congregação; pode editar"
            />
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Produtos"
        descricao="Escolha o produto e depois a variação — o saldo é conferido na hora"
      >
        <div className="space-y-3">
          {itens.map((item, index) => {
            const produto = produtos.find((p) => p.id === item.produtoId)
            const variacao = variacaoDe(item)
            const semEstoque = variacao && item.quantidade > variacao.disponivel
            const esgotado =
              produto && produto.variacoes.every((v) => v.disponivel <= 0)

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    {index === 0 && (
                      <Label>
                        Produto <span className="text-destructive">*</span>
                      </Label>
                    )}
                    <NativeSelect
                      value={item.produtoId}
                      onChange={(e) =>
                        atualizarItem(index, {
                          produtoId: e.target.value,
                          variacaoId: "",
                        })
                      }
                      aria-label={`Produto ${index + 1}`}
                    >
                      <option value="" disabled>
                        Selecione o produto
                      </option>
                      {produtos.map((p) => {
                        const total = p.variacoes.reduce(
                          (a, v) => a + v.disponivel,
                          0
                        )
                        return (
                          <option key={p.id} value={p.id} disabled={total <= 0}>
                            {p.nome} · {formatarBRL(p.precoVenda)}
                            {total <= 0 ? " (esgotado)" : ""}
                          </option>
                        )
                      })}
                    </NativeSelect>
                  </div>

                  <div className="w-40 space-y-2">
                    {index === 0 && <Label>Variação</Label>}
                    <NativeSelect
                      value={item.variacaoId}
                      onChange={(e) =>
                        atualizarItem(index, { variacaoId: e.target.value })
                      }
                      disabled={!item.produtoId}
                      aria-label={`Variação do produto ${index + 1}`}
                    >
                      <option value="" disabled>
                        {item.produtoId ? "Selecione" : "Escolha o produto"}
                      </option>
                      {produto?.variacoes.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={v.disponivel <= 0}
                        >
                          {descreverVariacao(v)}
                          {v.disponivel <= 0
                            ? " (indisponível)"
                            : ` (${v.disponivel})`}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="w-20 space-y-2">
                    {index === 0 && <Label>Qtd.</Label>}
                    <Input
                      type="number"
                      min={1}
                      max={variacao?.disponivel}
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
                    {produto && item.variacaoId
                      ? formatarBRL(produto.precoVenda * item.quantidade)
                      : "—"}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover produto"
                    className="text-neutral-400"
                    disabled={itens.length === 1}
                    onClick={() =>
                      setItens((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {esgotado && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-3.5" />
                    Este produto está indisponível em estoque.
                  </p>
                )}
                {semEstoque && variacao && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-3.5" />
                    Indisponível em estoque — só há {variacao.disponivel}{" "}
                    disponível(is). Adicione mais em Estoque.
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
              setItens((prev) => [
                ...prev,
                { produtoId: "", variacaoId: "", quantidade: 1 },
              ])
            }
          >
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </div>
      </Secao>

      <Secao titulo="Pagamento e evento">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Forma de pagamento <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAS_PAGAMENTO.map((f) => (
                <Button
                  key={f.value}
                  type="button"
                  variant={formaPagamento === f.value ? "default" : "outline"}
                  onClick={() => setFormaPagamento(f.value)}
                  className="h-11 rounded-xl"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          {eventos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="v-evento">Evento</Label>
              <NativeSelect
                id="v-evento"
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
              >
                <option value="">Venda avulsa (sem evento)</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nome}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="v-obs">Observações</Label>
            <Textarea
              id="v-obs"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
      </Secao>

      <div className="card-surface sticky bottom-0 flex items-center justify-between gap-4 p-4">
        <div>
          <p className="eyebrow">Total</p>
          <p className="text-2xl font-bold">{formatarBRL(total)}</p>
        </div>
        <Button
          size="lg"
          onClick={enviar}
          disabled={pending || !podeEnviar}
          className="min-w-40 rounded-xl"
        >
          {pending && <Loader2 className="animate-spin" />}
          {vendaInicial ? "Salvar alterações" : "Confirmar venda"}
        </Button>
      </div>
    </div>
  )
}
