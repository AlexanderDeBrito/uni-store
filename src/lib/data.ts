/**
 * Converte "YYYY-MM-DD" de um <input type="date"> em Date no fuso local.
 *
 * `new Date("2026-08-15")` é interpretado como meia-noite UTC, o que no Brasil
 * (UTC-3) exibe o dia anterior. Acrescentar a hora força a leitura local.
 */
export function parseDataLocal(valor: string, fimDoDia = false): Date | null {
  if (!valor) return null
  const sufixo = fimDoDia ? "T23:59:59.999" : "T00:00:00"
  const data = new Date(`${valor}${sufixo}`)
  return Number.isNaN(data.getTime()) ? null : data
}
