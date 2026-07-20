"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const abas = [
  { href: "/produtos", label: "Produtos" },
  { href: "/produtos/modelos", label: "Modelos" },
]

export function ProdutosTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-5 inline-flex gap-1 rounded-xl bg-neutral-100 p-1">
      {abas.map((aba) => {
        const ativo = pathname === aba.href
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            {aba.label}
          </Link>
        )
      })}
    </div>
  )
}
