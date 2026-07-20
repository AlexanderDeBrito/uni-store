import type { LucideIcon } from "lucide-react"

/** Card de indicador: ícone em quadrado, etiqueta, número grande e detalhe. */
export function StatCard({
  icone: Icone,
  etiqueta,
  valor,
  detalhe,
  marcador,
  destaque,
}: {
  icone: LucideIcon
  etiqueta: string
  valor: string
  detalhe?: string
  marcador?: string
  destaque?: boolean
}) {
  return (
    <div className="card-surface flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            destaque ? "bg-neutral-900" : "bg-neutral-100"
          }`}
        >
          <Icone
            className={`size-5 ${destaque ? "text-white" : "text-neutral-700"}`}
          />
        </div>
        {marcador && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            {marcador}
          </span>
        )}
      </div>
      <div>
        <p className="eyebrow mb-1 tracking-wider">{etiqueta}</p>
        <p className="text-2xl font-bold text-neutral-900">{valor}</p>
        {detalhe && <p className="mt-1 text-xs text-neutral-400">{detalhe}</p>}
      </div>
    </div>
  )
}
