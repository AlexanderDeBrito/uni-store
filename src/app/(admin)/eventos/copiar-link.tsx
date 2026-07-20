"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Copia o link público de reserva do evento para a área de transferência. */
export function CopiarLink({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    const url = `${window.location.origin}/r/${slug}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt("Copie o link de reserva:", url)
      return
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl"
      onClick={copiar}
      title="Copiar link público de reserva"
    >
      {copiado ? (
        <>
          <Check className="size-4" /> Copiado!
        </>
      ) : (
        <>
          <Copy className="size-4" /> Link de reserva
        </>
      )}
    </Button>
  )
}
