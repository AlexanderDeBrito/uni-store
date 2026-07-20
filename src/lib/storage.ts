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

/**
 * A chave vai em cabeçalho HTTP, que só aceita ASCII. Se alguém colar o texto
 * de exemplo (com "→", "<", ">"), o erro apareceria como um críptico
 * "Cannot convert argument to a ByteString" — melhor detectar aqui.
 */
function chaveValida(chave: string | undefined): boolean {
  if (!chave || chave.length < 40) return false
  if (/[^\x20-\x7E]/.test(chave)) return false // caractere não-ASCII
  if (/[<>]/.test(chave)) return false // sobrou placeholder
  return true
}

/** O upload só funciona com a service role key configurada (nunca exposta ao browser). */
export function storageConfigurado(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && chaveValida(process.env.SUPABASE_SERVICE_ROLE_KEY)
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

export type UploadAssinado = {
  signedUrl: string
  publicUrl: string
}

/**
 * Cria uma URL assinada para o navegador enviar o arquivo direto ao Supabase.
 *
 * Enviar via Server Action esbarraria no limite de corpo do Next (1 MB) e no
 * da Vercel (~4,5 MB); indo direto, só vale o limite do bucket (10 MB).
 */
export async function criarUploadAssinado(
  nomeArquivo: string,
  tipo: string,
  pasta: string
): Promise<UploadAssinado> {
  if (!TIPOS_ACEITOS.includes(tipo)) {
    throw new Error("Formato inválido. Use PNG, JPEG, WEBP ou PDF.")
  }
  if (!process.env.SUPABASE_URL) {
    throw new Error("Upload indisponível: falta configurar SUPABASE_URL.")
  }
  if (!chaveValida(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error(
      "A SUPABASE_SERVICE_ROLE_KEY está inválida — parece o texto de exemplo. " +
        "Copie a chave real em Supabase → Settings → API → service_role."
    )
  }

  const caminho = `${pasta}/${Date.now()}-${nomeSeguro(nomeArquivo)}`
  const supabase = client()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(caminho)
  if (error || !data) {
    throw new Error(`Falha ao preparar o upload: ${error?.message ?? "erro"}`)
  }

  const base = process.env.SUPABASE_URL as string
  const signedUrl = data.signedUrl.startsWith("http")
    ? data.signedUrl
    : `${base}${data.signedUrl}`

  return {
    signedUrl,
    publicUrl: `${base}/storage/v1/object/public/${BUCKET}/${caminho}`,
  }
}

/** Garante que a URL gravada no banco veio mesmo do nosso bucket. */
export function urlDoBucket(url: string): boolean {
  const base = process.env.SUPABASE_URL
  if (!base) return false
  return url.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`)
}
