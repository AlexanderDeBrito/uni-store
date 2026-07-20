"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { TAMANHOS } from "@/lib/constantes"

/** Filtros por modelo, cor e tamanho via query string (produtos e estoque). */
export function FiltrosSku({
  modelos,
  resultados,
}: {
  modelos: { id: string; nome: string }[]
  resultados?: number
}) {
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
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <NativeSelect
        value={params.get("modelo") ?? ""}
        onChange={(e) => aplicar("modelo", e.target.value)}
        aria-label="Filtrar por modelo"
        className="h-10 w-full rounded-xl bg-white sm:w-56"
      >
        <option value="">Todos os modelos</option>
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </NativeSelect>

      <div className="relative w-full sm:w-52">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Filtrar por cor"
          defaultValue={params.get("cor") ?? ""}
          onChange={(e) => aplicarComAtraso("cor", e.target.value)}
          className="h-10 rounded-xl bg-white pl-9"
        />
      </div>

      <NativeSelect
        value={params.get("tamanho") ?? ""}
        onChange={(e) => aplicar("tamanho", e.target.value)}
        aria-label="Filtrar por tamanho"
        className="h-10 w-full rounded-xl bg-white sm:w-44"
      >
        <option value="">Todos os tamanhos</option>
        {TAMANHOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </NativeSelect>

      {resultados !== undefined && (
        <span className="ml-auto text-sm text-neutral-400">
          {resultados} resultado{resultados === 1 ? "" : "s"}
        </span>
      )}
    </div>
  )
}
