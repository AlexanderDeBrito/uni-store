"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

export function FiltrosReservas({
  eventos,
}: {
  eventos: { id: string; nome: string }[]
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
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar por nome, telefone ou código"
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => aplicar("q", valor), 350)
          }}
          className="h-10 rounded-xl bg-white pl-9"
        />
      </div>
      <NativeSelect
        value={params.get("evento") ?? ""}
        onChange={(e) => aplicar("evento", e.target.value)}
        aria-label="Filtrar por evento"
        className="h-10 w-full rounded-xl bg-white sm:w-56"
      >
        <option value="">Todos os eventos</option>
        {eventos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        value={params.get("status") ?? ""}
        onChange={(e) => aplicar("status", e.target.value)}
        aria-label="Filtrar por status"
        className="h-10 w-full rounded-xl bg-white sm:w-44"
      >
        <option value="">Todos os status</option>
        <option value="RESERVADA">Reservada</option>
        <option value="RETIRADA">Retirada</option>
        <option value="INADIMPLENTE">Inadimplente</option>
        <option value="CANCELADA">Cancelada</option>
      </NativeSelect>
    </div>
  )
}
