"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle2, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { formatarBRL } from "@/lib/money"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { criarReserva } from "@/server/reservas"

export type ProdutoDisponivel = {
  id: string
  label: string
  precoVenda: number
  disponivel: number
}

type ItemForm = { produtoId: string; quantidade: number }

export function ReservaForm({
  eventoId,
  produtos,
  setores,
  congregacoes,
}: {
  eventoId: string
  produtos: ProdutoDisponivel[]
  setores: { id: string; nome: string }[]
  congregacoes: { id: string; nome: string; setorId: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [codigo, setCodigo] = useState<string | null>(null)

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpf, setCpf] = useState("")
  const [setorId, setSetorId] = useState("")
  const [congregacaoId, setCongregacaoId] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [itens, setItens] = useState<ItemForm[]>([
    { produtoId: "", quantidade: 1 },
  ])

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

  // Soma por produto para não deixar pedir mais do que o disponível somando linhas.
  const excedeu = itens.some((item) => {
    if (!item.produtoId) return false
    const p = produtos.find((x) => x.id === item.produtoId)
    if (!p) return false
    const somaDoProduto = itens
      .filter((i) => i.produtoId === item.produtoId)
      .reduce((acc, i) => acc + i.quantidade, 0)
    return somaDoProduto > p.disponivel
  })

  const podeEnviar =
    nome.trim().length > 0 &&
    telefone.trim().length >= 8 &&
    itens.some((i) => i.produtoId) &&
    !excedeu

  function atualizarItem(index: number, patch: Partial<ItemForm>) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function enviar() {
    startTransition(async () => {
      const res = await criarReserva({
        eventoId,
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim() || undefined,
        congregacaoId: congregacaoId || undefined,
        formaPagamento: formaPagamento
          ? (formaPagamento as "CARTAO" | "PIX" | "DINHEIRO")
          : undefined,
        observacoes: observacoes.trim() || undefined,
        itens: itens
          .filter((i) => i.produtoId)
          .map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      })
      if (res.ok && res.codigo) setCodigo(res.codigo)
      else toast.error(res.message)
    })
  }

  if (codigo) {
    const mensagem = encodeURIComponent(
      `Minha reserva na UNI STORE está confirmada! Código: ${codigo}`
    )
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-neutral-900" />
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">
          Reserva confirmada!
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Guarde seu código e apresente na retirada:
        </p>
        <p className="my-5 rounded-xl bg-neutral-950 py-4 font-mono text-3xl font-bold tracking-widest text-white">
          {codigo}
        </p>
        <p className="mb-5 text-sm text-neutral-600">
          Suas peças ficam separadas. Total a pagar na retirada:{" "}
          <strong>{formatarBRL(total)}</strong>
        </p>
        <a
          href={`https://wa.me/?text=${mensagem}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50"
        >
          <MessageCircle className="size-4" /> Salvar no WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-2xl bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="r-nome">Nome completo *</Label>
        <Input
          id="r-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-tel">Telefone *</Label>
          <Input
            id="r-tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-cpf">CPF</Label>
          <Input
            id="r-cpf"
            inputMode="numeric"
            placeholder="opcional"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-setor">Setor</Label>
          <NativeSelect
            id="r-setor"
            value={setorId}
            onChange={(e) => {
              setSetorId(e.target.value)
              setCongregacaoId("")
            }}
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
          <Label htmlFor="r-cong">Congregação</Label>
          <NativeSelect
            id="r-cong"
            value={congregacaoId}
            onChange={(e) => setCongregacaoId(e.target.value)}
            disabled={!setorId}
          >
            <option value="">
              {setorId ? "Não informar" : "Escolha o setor"}
            </option>
            {congregacoesDoSetor.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Peças */}
      <div className="space-y-3">
        <Label>Peças *</Label>
        {itens.map((item, index) => {
          const produto = produtos.find((p) => p.id === item.produtoId)
          const somaDoProduto = produto
            ? itens
                .filter((i) => i.produtoId === item.produtoId)
                .reduce((acc, i) => acc + i.quantidade, 0)
            : 0
          const passou = produto && somaDoProduto > produto.disponivel
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <NativeSelect
                    value={item.produtoId}
                    onChange={(e) =>
                      atualizarItem(index, { produtoId: e.target.value })
                    }
                    aria-label={`Peça ${index + 1}`}
                  >
                    <option value="" disabled>
                      Escolha a peça
                    </option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} · {formatarBRL(p.precoVenda)} ({p.disponivel}{" "}
                        disp.)
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min={1}
                    max={produto?.disponivel}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarItem(index, {
                        quantidade: Math.max(
                          1,
                          Math.trunc(Number(e.target.value) || 1)
                        ),
                      })
                    }
                    aria-label={`Quantidade da peça ${index + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover peça"
                  disabled={itens.length === 1}
                  onClick={() =>
                    setItens((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {passou && (
                <p className="text-sm text-destructive">
                  Só há {produto.disponivel} disponível(is) desta peça.
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
          <Plus className="size-4" /> Adicionar peça
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="r-pag">Pagamento pretendido</Label>
        <NativeSelect
          id="r-pag"
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
        >
          <option value="">Decido na retirada</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="r-obs">Observações</Label>
        <Textarea
          id="r-obs"
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-neutral-950 px-4 py-3 text-white">
          <span className="text-xs tracking-widest text-neutral-400 uppercase">
            Total na retirada
          </span>
          <span className="text-xl font-bold">{formatarBRL(total)}</span>
        </div>
      )}

      <Button
        size="lg"
        className="w-full rounded-xl"
        onClick={enviar}
        disabled={pending || !podeEnviar}
      >
        {pending && <Loader2 className="animate-spin" />}
        Reservar
      </Button>
    </div>
  )
}
