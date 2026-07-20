"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const grupos = [
  {
    titulo: null,
    itens: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vendas", label: "Vendas", icon: ShoppingCart },
    ],
  },
  {
    titulo: "Catálogo",
    itens: [
      { href: "/produtos", label: "Produtos", icon: Package },
      { href: "/estoque", label: "Estoque", icon: Boxes },
      { href: "/pedidos", label: "Pedidos de produção", icon: ClipboardList },
    ],
  },
  {
    titulo: "Eventos",
    itens: [
      { href: "/eventos", label: "Eventos", icon: CalendarDays },
      { href: "/reservas", label: "Reservas", icon: Ticket },
    ],
  },
  {
    titulo: "Organização",
    itens: [
      { href: "/setores", label: "Setores", icon: Building2 },
      { href: "/congregacoes", label: "Congregações", icon: Users },
    ],
  },
]

/** Navegação da sidebar/menu — desenhada para fundo escuro (neutral-950). */
export function NavLinks({
  onNavigate,
  alertaPedidos = 0,
}: {
  onNavigate?: () => void
  alertaPedidos?: number
}) {
  const pathname = usePathname()

  return (
    <nav className="space-y-5">
      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className="space-y-1">
          {grupo.titulo && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
              {grupo.titulo}
            </p>
          )}
          {grupo.itens.map(({ href, label, icon: Icon }) => {
            const ativo = pathname === href || pathname.startsWith(href + "/")
            const mostrarAlerta = href === "/pedidos" && alertaPedidos > 0
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    ativo ? "text-neutral-950" : "text-neutral-500"
                  )}
                />
                <span className="flex-1 truncate">{label}</span>
                {mostrarAlerta && (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                    title={`${alertaPedidos} pedido(s) em atraso`}
                  >
                    {alertaPedidos}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
