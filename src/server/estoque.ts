"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { parseBRL } from "@/lib/money"
import type { ActionState } from "./action-state"

const entradaSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z
    .number({ message: "Informe a quantidade" })
    .int("Quantidade deve ser um número inteiro")
    .positive("Quantidade deve ser maior que zero"),
  custoUnitario: z
    .number({ message: "Informe o custo unitário do lote" })
    .int()
    .positive("Custo unitário deve ser maior que zero"),
  data: z.coerce.date(),
  observacao: z.string().trim().optional(),
})

/** Entrada de produção: soma ao estoque com o custo unitário do lote. */
export async function registrarEntrada(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth()

  const custo = parseBRL((formData.get("custoUnitario") as string) ?? "")
  const parsed = entradaSchema.safeParse({
    produtoId: formData.get("produtoId"),
    quantidade: Number(formData.get("quantidade")),
    custoUnitario: custo ?? undefined,
    data: (formData.get("data") as string) || new Date(),
    observacao: (formData.get("observacao") as string) || undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { produtoId, quantidade, custoUnitario, data, observacao } =
    parsed.data

  await db.$transaction(async (tx) => {
    await tx.movimentacaoEstoque.create({
      data: {
        produtoId,
        tipo: "ENTRADA",
        origem: "PRODUCAO",
        quantidade,
        custoUnitario,
        data,
        observacao: observacao || null,
        usuarioId: session.user.id,
      },
    })
    await tx.produto.update({
      where: { id: produtoId },
      data: { estoqueAtual: { increment: quantidade } },
    })
  })

  revalidatePath("/estoque")
  revalidatePath("/produtos")
  return { ok: true, message: "Entrada registrada." }
}

const ajusteSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  tipo: z.enum(["AJUSTE_ENTRADA", "AJUSTE_SAIDA"]),
  quantidade: z
    .number({ message: "Informe a quantidade" })
    .int("Quantidade deve ser um número inteiro")
    .positive("Quantidade deve ser maior que zero"),
  observacao: z
    .string()
    .trim()
    .min(1, "Observação é obrigatória em ajustes manuais"),
})

/** Ajuste manual de estoque (entrada ou saída) com observação obrigatória. */
export async function registrarAjuste(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth()

  const parsed = ajusteSchema.safeParse({
    produtoId: formData.get("produtoId"),
    tipo: formData.get("tipo"),
    quantidade: Number(formData.get("quantidade")),
    observacao: formData.get("observacao"),
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { produtoId, tipo, quantidade, observacao } = parsed.data

  try {
    await db.$transaction(async (tx) => {
      if (tipo === "AJUSTE_SAIDA") {
        const res = await tx.produto.updateMany({
          where: { id: produtoId, estoqueAtual: { gte: quantidade } },
          data: { estoqueAtual: { decrement: quantidade } },
        })
        if (res.count === 0) {
          const p = await tx.produto.findUnique({ where: { id: produtoId } })
          throw new Error(
            `Estoque insuficiente. Disponível: ${p?.estoqueAtual ?? 0}`
          )
        }
      } else {
        await tx.produto.update({
          where: { id: produtoId },
          data: { estoqueAtual: { increment: quantidade } },
        })
      }
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo,
          origem: "AJUSTE_MANUAL",
          quantidade,
          observacao,
          usuarioId: session.user.id,
        },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/estoque")
  return { ok: true, message: "Ajuste registrado." }
}
