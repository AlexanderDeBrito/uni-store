"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

/**
 * Campo numérico que pode ficar vazio enquanto o usuário digita.
 *
 * Um input controlado com `Number(e.target.value) || 0` nunca esvazia: ao
 * apagar tudo o estado vira 0 e o React repõe "0" na tela, obrigando a digitar
 * depois do zero. Aqui o texto é guardado como string e só vira número ao sair
 * do campo — dá para limpar e digitar normalmente.
 */
export function InputNumero({
  valor,
  aoMudar,
  min = 0,
  max,
  className,
  ...props
}: {
  valor: number
  aoMudar: (valor: number) => void
  min?: number
  max?: number
  className?: string
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "min" | "max"
>) {
  const [texto, setTexto] = useState(() => String(valor))
  const focado = useRef(false)

  // Ressincroniza quando o valor muda por fora (botões +/-, reset do form),
  // sem atropelar o campo que o usuário deixou vazio de propósito.
  useEffect(() => {
    if (focado.current && texto === "") return
    if (Number(texto) !== valor) setTexto(String(valor))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  function limitar(n: number): number {
    let saida = n
    if (min !== undefined) saida = Math.max(min, saida)
    if (max !== undefined) saida = Math.min(max, saida)
    return saida
  }

  return (
    <Input
      {...props}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={texto}
      className={className}
      onFocus={(e) => {
        focado.current = true
        e.target.select() // clicar já seleciona: digitar substitui
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        const bruto = e.target.value

        // Vazio continua vazio na tela; o pai recebe o mínimo.
        if (bruto === "") {
          setTexto("")
          aoMudar(min ?? 0)
          return
        }

        const numero = Number(bruto)
        if (Number.isNaN(numero)) return

        const limitado = limitar(Math.trunc(numero))
        setTexto(String(limitado))
        aoMudar(limitado)
      }}
      onBlur={(e) => {
        focado.current = false
        if (texto === "") {
          const padrao = min ?? 0
          setTexto(String(padrao))
          aoMudar(padrao)
        }
        props.onBlur?.(e)
      }}
    />
  )
}
