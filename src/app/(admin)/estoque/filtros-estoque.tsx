"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

export function FiltrosEstoque({
  produtos,
  resultados,
}: {
  produtos: { id: string; nome: string }[]
  resultados: number
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

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <NativeSelect
        value={params.get("produto") ?? ""}
        onChange={(e) => aplicar("produto", e.target.value)}
        aria-label="Filtrar por produto"
        className="h-10 w-full rounded-xl bg-white sm:w-64"
      >
        <option value="">Todos os produtos</option>
        {produtos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </NativeSelect>

      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar produto"
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
        {resultados} variaç{resultados === 1 ? "ão" : "ões"}
      </span>
    </div>
  )
}
