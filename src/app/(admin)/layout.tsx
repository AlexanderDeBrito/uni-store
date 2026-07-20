import { LogOut, Store } from "lucide-react"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { NavLinks } from "@/components/layout/nav-links"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { logout } from "./actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  // Badge de pedidos de produção vencidos e ainda não recebidos.
  const alertaPedidos = await db.pedidoProducao.count({
    where: {
      status: { in: ["ENCOMENDADO", "RECEBIDO_PARCIAL"] },
      dataPrevisaoEntrega: { lt: new Date() },
    },
  })

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[230px] flex-col bg-neutral-950 lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white">
            <Store className="size-4 text-neutral-950" />
          </div>
          <span className="text-sm font-semibold tracking-[0.18em] text-white">
            UNI STORE
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks alertaPedidos={alertaPedidos} />
        </div>
        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {session.user.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <p
              className="truncate text-xs font-medium text-neutral-200"
              title={session.user.name ?? undefined}
            >
              {session.user.name}
            </p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-[230px]">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-2 bg-neutral-950 px-3 py-2 text-white lg:hidden">
          <MobileMenu alertaPedidos={alertaPedidos} />
          <span className="text-sm font-semibold tracking-[0.18em]">
            UNI STORE
          </span>
          <form action={logout} className="ml-auto">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sair"
              className="text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
