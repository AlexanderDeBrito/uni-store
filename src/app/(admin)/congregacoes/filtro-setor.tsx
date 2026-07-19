"use client"

import { usePathname, useRouter } from "next/navigation"
import { NativeSelect } from "@/components/ui/native-select"

export function FiltroSetor({
  setores,
  setorSelecionado,
}: {
  setores: { id: string; nome: string }[]
  setorSelecionado: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="max-w-xs">
      <NativeSelect
        value={setorSelecionado}
        onChange={(e) => {
          const v = e.target.value
          router.replace(v ? `${pathname}?setor=${v}` : pathname)
        }}
        aria-label="Filtrar por setor"
        className="bg-white"
      >
        <option value="">Todos os setores</option>
        {setores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
