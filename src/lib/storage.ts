import { createClient } from "@supabase/supabase-js"

const BUCKET = "uni-store"

export const TIPOS_ACEITOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]

export const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB

export type ArquivoSalvo = {
  url: string
  nome: string
  tipo: string
}

/** O upload só funciona com a service role key configurada (nunca exposta ao browser). */
export function storageConfigurado(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function client() {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  )
}

function nomeSeguro(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-80)
}

/**
 * Envia o arquivo ao bucket e devolve a URL pública.
 * Retorna null quando não há arquivo; lança Error em falha de validação/upload.
 */
export async function salvarArquivo(
  arquivo: File | null,
  pasta: string
): Promise<ArquivoSalvo | null> {
  if (!arquivo || arquivo.size === 0) return null

  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new Error("Formato inválido. Use PNG, JPEG, WEBP ou PDF.")
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("Arquivo muito grande. O limite é 10 MB.")
  }
  if (!storageConfigurado()) {
    throw new Error(
      "Upload indisponível: configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  const caminho = `${pasta}/${Date.now()}-${nomeSeguro(arquivo.name)}`
  const bytes = Buffer.from(await arquivo.arrayBuffer())

  const { error } = await client()
    .storage.from(BUCKET)
    .upload(caminho, bytes, { contentType: arquivo.type, upsert: false })

  if (error) throw new Error(`Falha no upload: ${error.message}`)

  const { data } = client().storage.from(BUCKET).getPublicUrl(caminho)
  return { url: data.publicUrl, nome: arquivo.name, tipo: arquivo.type }
}
