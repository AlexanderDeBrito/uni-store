"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { parseBRL } from "@/lib/money"
import type { ActionState } from "./action-state"

const produtoSchema = z.object({
  id: z.string().optional(),
  modelo: z.string().trim().min(1, "Informe o modelo"),
  cor: z.string().trim().min(1, "Informe a cor"),
  tamanho: z.string().trim().min(1, "Selecione o tamanho"),
  precoVenda: z.number().int().positive("Informe o preço de venda"),
  custoReferencia: z.number().int().nonnegative().nullable(),
  descricao: z.string().trim().optional(),
})

export async function salvarProduto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const preco = parseBRL((formData.get("precoVenda") as string) ?? "")
  const custoStr = ((formData.get("custoReferencia") as string) ?? "").trim()
  const custo = custoStr === "" ? null : parseBRL(custoStr)
  if (custoStr !== "" && custo === null) {
    return { ok: false, message: "Custo de referência inválido." }
  }

  const parsed = produtoSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    modelo: formData.get("modelo"),
    cor: formData.get("cor"),
    tamanho: formData.get("tamanho"),
    precoVenda: preco ?? 0,
    custoReferencia: custo,
    descricao: (formData.get("descricao") as string) || undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { id, modelo, cor, tamanho, precoVenda, custoReferencia, descricao } =
    parsed.data
  try {
    const data = {
      modelo,
      cor,
      tamanho,
      precoVenda,
      custoReferencia,
      descricao: descricao || null,
    }
    if (id) {
      await db.produto.update({ where: { id }, data })
    } else {
      await db.produto.create({ data })
    }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        message: `Já existe o produto ${modelo} ${cor} — ${tamanho}.`,
      }
    }
    throw e
  }

  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: id ? "Produto atualizado." : "Produto criado." }
}

export async function excluirProduto(id: string): Promise<ActionState> {
  await requireAuth()

  const produto = await db.produto.findUnique({
    where: { id },
    include: {
      _count: { select: { vendaItens: true, movimentacoes: true } },
    },
  })
  if (!produto) return { ok: false, message: "Produto não encontrado." }

  if (produto.estoqueAtual > 0) {
    return {
      ok: false,
      message: `Não é possível excluir: há ${produto.estoqueAtual} un. em estoque. Zere o estoque com um ajuste antes.`,
    }
  }
  if (produto._count.vendaItens > 0 || produto._count.movimentacoes > 0) {
    return {
      ok: false,
      message:
        "Não é possível excluir: o produto tem vendas ou movimentações registradas.",
    }
  }

  await db.produto.delete({ where: { id } })
  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: "Produto excluído." }
}
