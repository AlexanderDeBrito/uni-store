"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CATEGORIAS } from "@/lib/produto"

export function FiltrosCatalogo({ resultados }: { resultados: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categoriaAtual = params.get("categoria") ?? ""

  function aplicar(chave: string, valor: string) {
    const novo = new URLSearchParams(params)
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    router.replace(`${pathname}?${novo.toString()}`)
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => aplicar("categoria", "")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            categoriaAtual === ""
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => aplicar("categoria", c.value)}
            title={c.descricao}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              categoriaAtual === c.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nome do produto"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => {
              const valor = e.target.value
              if (timer.current) clearTimeout(timer.current)
              timer.current = setTimeout(() => aplicar("q", valor), 350)
            }}
            className="h-10 rounded-xl bg-white pl-9"
          />
        </div>
        <span className="ml-auto text-sm text-neutral-400">
          {resultados} produto{resultados === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  )
}
