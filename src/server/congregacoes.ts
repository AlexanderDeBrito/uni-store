"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import type { ActionState } from "./action-state"

const congregacaoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome da congregação"),
  setorId: z.string().min(1, "Selecione o setor"),
  lider: z.string().trim().min(1, "Informe o nome do líder de jovens"),
  ativo: z.boolean(),
})

export async function salvarCongregacao(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const parsed = congregacaoSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    nome: formData.get("nome"),
    setorId: formData.get("setorId"),
    lider: formData.get("lider"),
    ativo: formData.get("ativo") === "on",
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { id, nome, setorId, lider, ativo } = parsed.data
  try {
    if (id) {
      await db.congregacao.update({
        where: { id },
        data: { nome, setorId, lider, ativo },
      })
    } else {
      await db.congregacao.create({ data: { nome, setorId, lider, ativo } })
    }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        message: `Já existe a congregação "${nome}" nesse setor.`,
      }
    }
    throw e
  }

  revalidatePath("/congregacoes")
  return {
    ok: true,
    message: id ? "Congregação atualizada." : "Congregação criada.",
  }
}
