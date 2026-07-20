"use client"

import { useActionState, useMemo, useState } from "react"
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { formatarBRL } from "@/lib/money"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"
import { criarReserva, type ReservaResult } from "@/server/reservas"

const inicial: ReservaResult = { ok: false }

export function ReservaForm({
  eventoId,
  produtos,
  setores,
  congregacoes,
}: {
  eventoId: string
  produtos: { id: string; label: string; precoVenda: number }[]
  setores: { id: string; nome: string }[]
  congregacoes: { id: string; nome: string; setorId: string }[]
}) {
  const [state, action, pending] = useActionState(criarReserva, inicial)
  const [setorId, setSetorId] = useState("")
  const [produtoId, setProdutoId] = useState("")
  const [quantidade, setQuantidade] = useState(1)

  const congregacoesDoSetor = useMemo(
    () => congregacoes.filter((c) => c.setorId === setorId),
    [congregacoes, setorId]
  )

  const produto = produtos.find((p) => p.id === produtoId)
  const total = produto ? produto.precoVenda * quantidade : 0

  // Tela de confirmação com o código da reserva
  if (state.ok && state.codigo) {
    const mensagem = encodeURIComponent(
      `Minha reserva na UNI STORE está confirmada! Código: ${state.codigo}`
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
          {state.codigo}
        </p>
        <a
          href={`https://wa.me/?text=${mensagem}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50"
        >
          <MessageCircle className="size-4" /> Salvar no WhatsApp
        </a>
        <p className="mt-5 text-xs text-neutral-400">
          O pagamento é feito presencialmente na retirada.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5 rounded-2xl bg-white p-6">
      <input type="hidden" name="eventoId" value={eventoId} />

      <div className="space-y-2">
        <Label htmlFor="r-nome">Nome completo *</Label>
        <Input id="r-nome" name="nome" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-tel">Telefone *</Label>
          <Input
            id="r-tel"
            name="telefone"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-cpf">CPF</Label>
          <Input id="r-cpf" name="cpf" inputMode="numeric" placeholder="opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-setor">Setor</Label>
          <NativeSelect
            id="r-setor"
            value={setorId}
            onChange={(e) => setSetorId(e.target.value)}
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
          <NativeSelect id="r-cong" name="congregacaoId" disabled={!setorId}>
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

      <div className="space-y-2">
        <Label htmlFor="r-produto">Produto *</Label>
        <NativeSelect
          id="r-produto"
          name="produtoId"
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          required
        >
          <option value="" disabled>
            Escolha a peça
          </option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} · {formatarBRL(p.precoVenda)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-qtd">Quantidade *</Label>
          <Input
            id="r-qtd"
            name="quantidade"
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) =>
              setQuantidade(Math.max(1, Math.trunc(Number(e.target.value) || 1)))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-pag">Pagamento pretendido *</Label>
          <NativeSelect id="r-pag" name="formaPagamento" defaultValue="" required>
            <option value="" disabled>
              Escolha
            </option>
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="r-obs">Observações</Label>
        <Textarea id="r-obs" name="observacoes" rows={2} />
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-neutral-950 px-4 py-3 text-white">
          <span className="text-xs tracking-widest text-neutral-400 uppercase">
            Total a pagar na retirada
          </span>
          <span className="text-xl font-bold">{formatarBRL(total)}</span>
        </div>
      )}

      {!state.ok && state.message && (
        <p className="text-sm font-medium text-destructive">{state.message}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl"
        disabled={pending}
      >
        {pending && <Loader2 className="animate-spin" />}
        Reservar
      </Button>
    </form>
  )
}
