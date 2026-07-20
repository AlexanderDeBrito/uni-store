"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { parseDataLocal } from "@/lib/data"
import type { ActionState } from "./action-state"

const eventoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome do evento"),
  descricao: z.string().trim().optional(),
  local: z.string().trim().optional(),
  dataInicio: z.date({ message: "Informe a data de início" }),
  dataFim: z.string().optional(),
  prazoReserva: z.string().optional(),
  status: z.enum(["PLANEJADO", "ATIVO", "ENCERRADO"]),
})

function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

export async function salvarEvento(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const parsed = eventoSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    nome: formData.get("nome"),
    descricao: (formData.get("descricao") as string) || undefined,
    local: (formData.get("local") as string) || undefined,
    dataInicio: parseDataLocal((formData.get("dataInicio") as string) ?? ""),
    dataFim: (formData.get("dataFim") as string) || undefined,
    prazoReserva: (formData.get("prazoReserva") as string) || undefined,
    status: formData.get("status"),
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const { id, nome, descricao, local, dataInicio, dataFim, prazoReserva, status } =
    parsed.data

  const data = {
    nome,
    descricao: descricao || null,
    local: local || null,
    dataInicio,
    dataFim: parseDataLocal(dataFim ?? ""),
    prazoReserva: parseDataLocal(prazoReserva ?? "", true),
    status,
  }

  try {
    if (id) {
      await db.evento.update({ where: { id }, data })
    } else {
      // slug único: acrescenta sufixo numérico se já existir
      const base = gerarSlug(nome) || "evento"
      let slug = base
      for (let i = 2; await db.evento.findUnique({ where: { slug } }); i++) {
        slug = `${base}-${i}`
      }
      await db.evento.create({ data: { ...data, slug } })
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Já existe um evento com esse identificador." }
    }
    throw e
  }

  revalidatePath("/eventos")
  return { ok: true, message: id ? "Evento atualizado." : "Evento criado." }
}

/** Duplica um evento (estrutura, sem vendas/reservas), como pede o PRD. */
export async function duplicarEvento(id: string): Promise<ActionState> {
  await requireAuth()

  const origem = await db.evento.findUnique({ where: { id } })
  if (!origem) return { ok: false, message: "Evento não encontrado." }

  const nome = `${origem.nome} (cópia)`
  const base = gerarSlug(nome)
  let slug = base
  for (let i = 2; await db.evento.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`
  }

  await db.evento.create({
    data: {
      nome,
      slug,
      descricao: origem.descricao,
      local: origem.local,
      dataInicio: origem.dataInicio,
      dataFim: origem.dataFim,
      prazoReserva: origem.prazoReserva,
      status: "PLANEJADO",
    },
  })

  revalidatePath("/eventos")
  return { ok: true, message: "Evento duplicado." }
}
