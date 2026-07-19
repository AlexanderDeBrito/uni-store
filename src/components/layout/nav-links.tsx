"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Church,
  LayoutDashboard,
  Map,
  Package,
  Shirt,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/produtos", label: "Produtos", icon: Shirt },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/setores", label: "Setores", icon: Map },
  { href: "/congregacoes", label: "Congregações", icon: Church },
]

/** Navegação da sidebar/menu — desenhada para fundo escuro (neutral-950). */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-white text-neutral-950"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
