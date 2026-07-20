"use client"

import { useRef, useState } from "react"
import { Check, FileText, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prepararUpload } from "@/server/upload"

const TIPOS = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
const MAXIMO = 10 * 1024 * 1024

export type ArquivoEnviado = {
  url: string
  nome: string
  tipo: string
}

/**
 * Envia o arquivo direto ao Supabase Storage (via URL assinada) e expõe o
 * resultado em inputs escondidos, para o formulário só carregar a URL.
 */
export function UploadArquivo({
  pasta,
  rotulo,
  campoUrl,
  campoNome,
  campoTipo,
  disponivel,
  arquivoAtual,
}: {
  pasta: string
  rotulo: string
  campoUrl: string
  campoNome: string
  campoTipo: string
  disponivel: boolean
  arquivoAtual?: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<ArquivoEnviado | null>(null)

  async function aoEscolher(arquivo: File) {
    setErro(null)

    if (!TIPOS.includes(arquivo.type)) {
      setErro("Formato inválido. Use PNG, JPEG, WEBP ou PDF.")
      return
    }
    if (arquivo.size > MAXIMO) {
      setErro(
        `Arquivo muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). O limite é 10 MB.`
      )
      return
    }

    setEnviando(true)
    try {
      const preparo = await prepararUpload(arquivo.name, arquivo.type, pasta)
      if (!preparo.ok) {
        setErro(preparo.message)
        return
      }

      const resposta = await fetch(preparo.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": arquivo.type },
        body: arquivo,
      })
      if (!resposta.ok) {
        setErro(`Falha ao enviar o arquivo (${resposta.status}).`)
        return
      }

      setEnviado({
        url: preparo.publicUrl,
        nome: arquivo.name,
        tipo: arquivo.type,
      })
    } catch {
      setErro("Não foi possível enviar o arquivo. Verifique sua conexão.")
    } finally {
      setEnviando(false)
    }
  }

  function limpar() {
    setEnviado(null)
    setErro(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`upload-${campoUrl}`}>{rotulo}</Label>

      {enviado && (
        <>
          <input type="hidden" name={campoUrl} value={enviado.url} />
          <input type="hidden" name={campoNome} value={enviado.nome} />
          <input type="hidden" name={campoTipo} value={enviado.tipo} />
        </>
      )}

      {enviado ? (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            {enviado.tipo === "application/pdf" ? (
              <FileText className="size-4 text-neutral-500" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enviado.url}
                alt={enviado.nome}
                className="size-full object-cover"
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">
              {enviado.nome}
            </p>
            <p className="flex items-center gap-1 text-xs text-neutral-500">
              <Check className="size-3" /> enviado
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remover arquivo"
            onClick={limpar}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={`upload-${campoUrl}`}
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={!disponivel || enviando}
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              if (arquivo) aoEscolher(arquivo)
            }}
            className="file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm"
          />
          {enviando && (
            <span className="absolute inset-y-0 right-2.5 flex items-center gap-1.5 bg-white pl-2 text-xs text-neutral-500">
              <Loader2 className="size-3.5 animate-spin" /> enviando…
            </span>
          )}
        </div>
      )}

      {arquivoAtual && !enviado && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Upload className="size-3" /> Atual: {arquivoAtual} — enviar outro
          substitui.
        </p>
      )}
      {erro && <p className="text-xs font-medium text-destructive">{erro}</p>}
      {!disponivel && (
        <p className="text-xs text-destructive">
          Upload indisponível: falta configurar SUPABASE_SERVICE_ROLE_KEY.
        </p>
      )}
    </div>
  )
}
