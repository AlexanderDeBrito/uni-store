/** Remove tudo que não é dígito. */
export function limparCpf(cpf: string): string {
  return cpf.replace(/\D/g, "")
}

/** Formata dígitos como XXX.XXX.XXX-XX (parcial enquanto digita). */
export function formatarCpf(cpf: string): string {
  const d = limparCpf(cpf).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Validação completa de CPF (dígitos verificadores). */
export function validarCpf(cpf: string): boolean {
  const d = limparCpf(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  const calcDigito = (base: string, pesoInicial: number) => {
    const soma = base
      .split("")
      .reduce((acc, ch, i) => acc + Number(ch) * (pesoInicial - i), 0)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const dv1 = calcDigito(d.slice(0, 9), 10)
  const dv2 = calcDigito(d.slice(0, 10), 11)
  return dv1 === Number(d[9]) && dv2 === Number(d[10])
}
