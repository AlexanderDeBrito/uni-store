/** Cabeçalho padrão das páginas: etiqueta, título, subtítulo e ação à direita. */
export function PageHeader({
  eyebrow,
  titulo,
  subtitulo,
  acao,
}: {
  eyebrow: string
  titulo: string
  subtitulo?: string
  acao?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-0.5 text-sm text-neutral-500">{subtitulo}</p>
        )}
      </div>
      {acao}
    </div>
  )
}
