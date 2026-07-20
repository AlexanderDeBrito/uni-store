"use server"

import { requireAuth } from "@/lib/auth"
import { criarUploadAssinado, type UploadAssinado } from "@/lib/storage"

export type UploadResult =
  | ({ ok: true } & UploadAssinado)
  | { ok: false; message: string }

/** Devolve ao navegador uma URL assinada para enviar o arquivo direto ao Storage. */
export async function prepararUpload(
  nomeArquivo: string,
  tipo: string,
  pasta: string
): Promise<UploadResult> {
  await requireAuth()

  try {
    const dados = await criarUploadAssinado(nomeArquivo, tipo, pasta)
    return { ok: true, ...dados }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}
