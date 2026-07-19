"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { limparCpf, validarCpf } from "@/lib/cpf"

export type ClienteRecorrente = {
  nome: string
  congregacaoId: string | null
  setorId: string | null
  lider: string | null
}

/** Autopreenchimento de cliente recorrente por CPF (regra 4.4 do PRD). */
export async function buscarClientePorCpf(
  cpf: string
): Promise<ClienteRecorrente | null> {
  await requireAuth()

  const digitos = limparCpf(cpf)
  if (!validarCpf(digitos)) return null

  const cliente = await db.cliente.findUnique({
    where: { cpf: digitos },
    include: { congregacao: { select: { id: true, setorId: true, lider: true } } },
  })
  if (!cliente) return null

  return {
    nome: cliente.nome,
    congregacaoId: cliente.congregacao?.id ?? null,
    setorId: cliente.congregacao?.setorId ?? null,
    lider: cliente.congregacao?.lider ?? null,
  }
}
