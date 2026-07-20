"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { limparCpf } from "@/lib/cpf"
import type { ActionState } from "./action-state"

const reservaSchema = z.object({
  eventoId: z.string().min(1),
  nome: z.string().trim().min(1, "Informe seu nome"),
  telefone: z.string().trim().min(8, "Informe um telefone válido"),
  cpf: z.string().trim().optional(),
  congregacaoId: z.string().optional(),
  produtoId: z.string().min(1, "Escolha o produto"),
  quantidade: z.coerce.number().int().positive("Quantidade inválida"),
  formaPagamento: z.enum(["CARTAO", "PIX", "DINHEIRO"], {
    message: "Escolha a forma de pagamento",
  }),
  observacoes: z.string().trim().optional(),
})

export type ReservaResult = ActionState & { codigo?: string }

/** Cria reserva pelo link público (sem login). Não bloqueia estoque — regra 7.1 do PRD. */
export async function criarReserva(
  _prev: ReservaResult,
  formData: FormData
): Promise<ReservaResult> {
  const parsed = reservaSchema.safeParse({
    eventoId: formData.get("eventoId"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    cpf: (formData.get("cpf") as string) || undefined,
    congregacaoId: (formData.get("congregacaoId") as string) || undefined,
    produtoId: formData.get("produtoId"),
    quantidade: formData.get("quantidade"),
    formaPagamento: formData.get("formaPagamento"),
    observacoes: (formData.get("observacoes") as string) || undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  const evento = await db.evento.findUnique({ where: { id: dados.eventoId } })
  if (!evento || evento.status === "ENCERRADO") {
    return { ok: false, message: "Este evento não está mais recebendo reservas." }
  }
  if (evento.prazoReserva && evento.prazoReserva < new Date()) {
    return { ok: false, message: "O prazo para reservas deste evento encerrou." }
  }

  const total = await db.reserva.count()
  const codigo = `R-${String(total + 1).padStart(4, "0")}`

  await db.reserva.create({
    data: {
      codigo,
      nome: dados.nome,
      telefone: dados.telefone,
      cpf: dados.cpf ? limparCpf(dados.cpf) : null,
      congregacaoId: dados.congregacaoId || null,
      eventoId: dados.eventoId,
      produtoId: dados.produtoId,
      quantidade: dados.quantidade,
      formaPagamento: dados.formaPagamento,
      observacoes: dados.observacoes || null,
    },
  })

  revalidatePath("/reservas")
  return { ok: true, message: "Reserva registrada!", codigo }
}

/** Confirma a retirada: registra pagamento efetivo e baixa o estoque. */
export async function confirmarRetirada(
  reservaId: string,
  formaPagamentoEfetiva: "CARTAO" | "PIX" | "DINHEIRO"
): Promise<ActionState> {
  const session = await requireAuth()

  try {
    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: { produto: { include: { modelo: true } } },
      })
      if (!reserva) throw new Error("Reserva não encontrada.")
      if (reserva.status !== "RESERVADA") {
        throw new Error("Esta reserva já foi retirada ou cancelada.")
      }

      const baixa = await tx.produto.updateMany({
        where: {
          id: reserva.produtoId,
          estoqueAtual: { gte: reserva.quantidade },
        },
        data: { estoqueAtual: { decrement: reserva.quantidade } },
      })
      if (baixa.count === 0) {
        throw new Error(
          `Estoque insuficiente de ${reserva.produto.modelo.nome} ${reserva.produto.cor} — ${reserva.produto.tamanho}. Disponível: ${reserva.produto.estoqueAtual}`
        )
      }

      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: reserva.produtoId,
          tipo: "SAIDA",
          origem: "RETIRADA_RESERVA",
          quantidade: reserva.quantidade,
          observacao: `Retirada da reserva ${reserva.codigo}`,
          usuarioId: session.user.id,
        },
      })

      await tx.reserva.update({
        where: { id: reservaId },
        data: {
          status: "RETIRADA",
          formaPagamentoEfetiva,
          dataRetirada: new Date(),
        },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/reservas")
  revalidatePath("/estoque")
  return { ok: true, message: "Retirada confirmada e estoque baixado." }
}

export async function cancelarReserva(reservaId: string): Promise<ActionState> {
  await requireAuth()

  const reserva = await db.reserva.findUnique({ where: { id: reservaId } })
  if (!reserva) return { ok: false, message: "Reserva não encontrada." }
  if (reserva.status === "RETIRADA") {
    return {
      ok: false,
      message: "Reserva já retirada — o estoque já foi baixado.",
    }
  }

  await db.reserva.update({
    where: { id: reservaId },
    data: { status: "CANCELADA" },
  })

  revalidatePath("/reservas")
  return { ok: true, message: "Reserva cancelada." }
}
