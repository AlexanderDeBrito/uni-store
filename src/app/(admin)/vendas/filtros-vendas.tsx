"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { FORMAS_PAGAMENTO } from "@/lib/constantes"

export function FiltrosVendas() {
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
    <div className="grid grid-cols-2 gap-2 lg:max-w-3xl lg:grid-cols-4">
      <Input
        type="date"
        aria-label="Data inicial"
        defaultValue={params.get("de") ?? ""}
        onChange={(e) => aplicar("de", e.target.value)}
        className="bg-white"
      />
      <Input
        type="date"
        aria-label="Data final"
        defaultValue={params.get("ate") ?? ""}
        onChange={(e) => aplicar("ate", e.target.value)}
        className="bg-white"
      />
      <NativeSelect
        value={params.get("forma") ?? ""}
        onChange={(e) => aplicar("forma", e.target.value)}
        aria-label="Forma de pagamento"
        className="bg-white"
      >
        <option value="">Todas as formas</option>
        {FORMAS_PAGAMENTO.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </NativeSelect>
      <Input
        placeholder="Nome ou CPF"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => aplicarComAtraso("q", e.target.value)}
        className="bg-white"
      />
    </div>
  )
}
