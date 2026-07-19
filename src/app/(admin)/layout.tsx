import { LogOut } from "lucide-react"
import { requireAuth } from "@/lib/auth"
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

  return (
    <div className="flex min-h-screen w-full bg-neutral-100">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-neutral-950 text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-white text-sm font-bold text-neutral-950">
            U
          </div>
          <span className="text-sm font-bold tracking-[0.2em]">
            UNI STORE
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-3">
          <p className="mb-2 truncate px-3 text-sm text-neutral-400">
            {session.user.name}
          </p>
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

      <div className="flex flex-1 flex-col lg:pl-60">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-2 bg-neutral-950 px-3 py-2 text-white lg:hidden">
          <MobileMenu />
          <span className="text-sm font-bold tracking-[0.2em]">UNI STORE</span>
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
