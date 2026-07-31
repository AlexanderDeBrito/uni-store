"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { urlDoBucket } from "@/lib/storage"
import type { ActionState } from "./action-state"

export type ModeloCriado = {
  ok: boolean
  message?: string
  modelo?: { id: string; nome: string }
}

/**
 * Cria um modelo rapidamente a partir do cadastro de produto e devolve o id,
 * para o formulário já selecioná-lo. A arte, se houver, já veio enviada ao
 * Storage pelo navegador (só chega a URL).
 */
export async function criarModeloRapido(dados: {
  nome: string
  arquivoUrl?: string
  arquivoNome?: string
  arquivoTipo?: string
}): Promise<ModeloCriado> {
  await requireAuth()

  const nome = dados.nome.trim()
  if (!nome) return { ok: false, message: "Informe o nome do modelo." }
  if (dados.arquivoUrl && !urlDoBucket(dados.arquivoUrl)) {
    return { ok: false, message: "Arquivo inválido." }
  }

  try {
    const modelo = await db.modelo.create({
      data: {
        nome,
        ...(dados.arquivoUrl && {
          arquivoUrl: dados.arquivoUrl,
          arquivoNome: dados.arquivoNome ?? null,
          arquivoTipo: dados.arquivoTipo ?? null,
        }),
      },
      select: { id: true, nome: true },
    })
    revalidatePath("/produtos")
    revalidatePath("/produtos/modelos")
    return { ok: true, message: "Modelo criado.", modelo }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: `Já existe um modelo chamado "${nome}".` }
    }
    return { ok: false, message: (e as Error).message }
  }
}

const modeloSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome do modelo"),
  descricao: z.string().trim().optional(),
  ativo: z.boolean(),
})

export async function salvarModelo(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const parsed = modeloSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    nome: formData.get("nome"),
    descricao: (formData.get("descricao") as string) || undefined,
    ativo: formData.get("ativo") === "on",
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const { id, nome, descricao, ativo } = parsed.data

  // O arquivo já foi enviado direto ao Storage pelo navegador; aqui chega só a URL.
  const arquivoUrl = (formData.get("arquivoUrl") as string) || ""
  if (arquivoUrl && !urlDoBucket(arquivoUrl)) {
    return { ok: false, message: "Arquivo inválido." }
  }

  const dados: Prisma.ModeloUncheckedCreateInput = {
    nome,
    descricao: descricao || null,
    ativo,
    ...(arquivoUrl && {
      arquivoUrl,
      arquivoNome: (formData.get("arquivoNome") as string) || null,
      arquivoTipo: (formData.get("arquivoTipo") as string) || null,
    }),
  }

  try {
    if (id) {
      await db.modelo.update({ where: { id }, data: dados })
    } else {
      await db.modelo.create({ data: dados })
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: `Já existe um modelo chamado "${nome}".` }
    }
    throw e
  }

  revalidatePath("/produtos")
  revalidatePath("/produtos/modelos")
  return { ok: true, message: id ? "Modelo atualizado." : "Modelo criado." }
}

export async function excluirModelo(id: string): Promise<ActionState> {
  await requireAuth()

  const modelo = await db.modelo.findUnique({
    where: { id },
    include: { _count: { select: { produtos: true, pedidoItens: true } } },
  })
  if (!modelo) return { ok: false, message: "Modelo não encontrado." }

  if (modelo._count.produtos > 0) {
    return {
      ok: false,
      message: `Não é possível excluir: ${modelo._count.produtos} produto(s) usam esse modelo.`,
    }
  }
  if (modelo._count.pedidoItens > 0) {
    return {
      ok: false,
      message: "Não é possível excluir: o modelo está em pedidos de produção.",
    }
  }

  await db.modelo.delete({ where: { id } })
  revalidatePath("/produtos/modelos")
  return { ok: true, message: "Modelo excluído." }
}
