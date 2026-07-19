"use client"

import { usePathname, useRouter } from "next/navigation"
import { NativeSelect } from "@/components/ui/native-select"

export function FiltroProduto({
  produtos,
  produtoSelecionado,
}: {
  produtos: { id: string; label: string }[]
  produtoSelecionado: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="max-w-sm">
      <NativeSelect
        value={produtoSelecionado}
        onChange={(e) => {
          const v = e.target.value
          router.replace(v ? `${pathname}?produto=${v}` : pathname)
        }}
        aria-label="Filtrar por produto"
        className="bg-white"
      >
        <option value="">Todos os produtos</option>
        {produtos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
