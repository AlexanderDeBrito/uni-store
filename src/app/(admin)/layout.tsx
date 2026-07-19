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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-white lg:flex">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            U
          </div>
          <span className="font-bold leading-tight">
            UNI STORE
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t p-3">
          <p className="mb-2 truncate px-3 text-sm text-muted-foreground">
            {session.user.name}
          </p>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-60">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-white px-3 py-2 lg:hidden">
          <MobileMenu />
          <span className="font-bold">UNI STORE</span>
          <form action={logout} className="ml-auto">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sair"
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
