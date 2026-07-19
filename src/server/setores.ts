"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import type { ActionState } from "./action-state"

const setorSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome do setor"),
  regiao: z.string().trim().optional(),
  ativo: z.boolean(),
})

export async function salvarSetor(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const parsed = setorSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    nome: formData.get("nome"),
    regiao: (formData.get("regiao") as string) || undefined,
    ativo: formData.get("ativo") === "on",
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { id, nome, regiao, ativo } = parsed.data
  try {
    if (id) {
      await db.setor.update({
        where: { id },
        data: { nome, regiao: regiao || null, ativo },
      })
    } else {
      await db.setor.create({ data: { nome, regiao: regiao || null, ativo } })
    }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, message: `Já existe um setor chamado "${nome}".` }
    }
    throw e
  }

  revalidatePath("/setores")
  return { ok: true, message: id ? "Setor atualizado." : "Setor criado." }
}
