import type { CategoriaProduto } from "@prisma/client"

export const CATEGORIAS: {
  value: CategoriaProduto
  label: string
  descricao: string
  usaModelo: "obrigatorio" | "opcional" | "nao"
  usaVariacoes: boolean
}[] = [
  {
    value: "VESTUARIO",
    label: "Vestuário",
    descricao: "Camisas, casacos, calças",
    usaModelo: "obrigatorio",
    usaVariacoes: true, // cor + tamanho + quantidade
  },
  {
    value: "ACESSORIO",
    label: "Acessórios",
    descricao: "Pulseiras, bonés, bottons, chaveiros",
    usaModelo: "obrigatorio",
    usaVariacoes: false, // cor opcional, quantidade única
  },
  {
    value: "INSTITUCIONAL",
    label: "Institucional",
    descricao: "Livros, devocionais, bíblias",
    usaModelo: "nao",
    usaVariacoes: false,
  },
  {
    value: "ALIMENTO",
    label: "Alimentos",
    descricao: "Água, refrigerante, café, chocolate quente",
    usaModelo: "nao",
    usaVariacoes: false,
  },
]

export function categoria(value: string) {
  return CATEGORIAS.find((c) => c.value === value)
}

export function labelCategoria(value: string): string {
  return categoria(value)?.label ?? value
}

/**
 * Alimentos por volume: converte litros em porções pelo tamanho do copo.
 * Ex.: 5 L com copo de 200 ml → 25 porções.
 */
export function porcoesDeLitros(litros: number, mlPorPorcao: number): number {
  if (mlPorPorcao <= 0) return 0
  return Math.floor((litros * 1000) / mlPorPorcao)
}

/** Rótulo curto da variação para listas e selects. */
export function descreverVariacao(v: {
  cor: string
  tamanho: string
}): string {
  const partes = [v.cor, v.tamanho].filter(Boolean)
  return partes.length > 0 ? partes.join(" — ") : "Padrão"
}
