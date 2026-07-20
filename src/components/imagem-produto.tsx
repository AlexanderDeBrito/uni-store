import { Shirt } from "lucide-react"
import { cn } from "@/lib/utils"

export type FonteImagem = {
  imagemUrl: string | null
  imagemTipo: string | null
  modelo: { arquivoUrl: string | null; arquivoTipo: string | null } | null
}

/** Imagem própria do produto; na falta dela, usa a arte do modelo. */
export function urlDaImagem(fonte: FonteImagem): string | null {
  const ehImagem = (tipo: string | null) =>
    tipo === null || tipo.startsWith("image/")

  if (fonte.imagemUrl && ehImagem(fonte.imagemTipo)) return fonte.imagemUrl
  if (fonte.modelo?.arquivoUrl && ehImagem(fonte.modelo.arquivoTipo)) {
    return fonte.modelo.arquivoUrl
  }
  return null
}

/**
 * Vitrine do produto. Sem imagem própria cai na arte do modelo; sem nenhuma,
 * mostra um marcador animado em vez de um quadrado vazio.
 */
export function ImagemProduto({
  fonte,
  alt,
  className,
}: {
  fonte: FonteImagem
  alt: string
  className?: string
}) {
  const url = urlDaImagem(fonte)

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={cn("size-full object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 bg-neutral-100",
        className
      )}
      aria-label="Produto sem imagem"
    >
      <span className="relative flex size-10 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-neutral-300/60" />
        <span className="absolute inset-0 rounded-full bg-neutral-200" />
        <Shirt className="relative size-5 text-neutral-400" />
      </span>
      <span className="text-[10px] tracking-widest text-neutral-400 uppercase">
        sem imagem
      </span>
    </div>
  )
}
