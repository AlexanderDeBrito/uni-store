"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { TAMANHOS } from "@/lib/constantes"

/** Filtros por modelo, cor e tamanho via query string (produtos e estoque). */
export function FiltrosSku() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function aplicar(chave: string, valor: string) {
    const novo = new URLSearchParams(params)
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    router.replace(`${pathname}?${novo.toString()}`)
  }

  function aplicarComAtraso(chave: string, valor: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => aplicar(chave, valor), 350)
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-3">
      <Input
        placeholder="Filtrar por modelo"
        defaultValue={params.get("modelo") ?? ""}
        onChange={(e) => aplicarComAtraso("modelo", e.target.value)}
        className="bg-white"
      />
      <Input
        placeholder="Filtrar por cor"
        defaultValue={params.get("cor") ?? ""}
        onChange={(e) => aplicarComAtraso("cor", e.target.value)}
        className="bg-white"
      />
      <NativeSelect
        value={params.get("tamanho") ?? ""}
        onChange={(e) => aplicar("tamanho", e.target.value)}
        aria-label="Filtrar por tamanho"
        className="bg-white"
      >
        <option value="">Todos os tamanhos</option>
        {TAMANHOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
