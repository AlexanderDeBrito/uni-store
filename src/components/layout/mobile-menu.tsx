"use client"

import { useState } from "react"
import { Menu, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NavLinks } from "./nav-links"

export function MobileMenu({ alertaPedidos = 0 }: { alertaPedidos?: number }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className="text-white hover:bg-white/10 hover:text-white"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 overflow-y-auto border-white/10 bg-neutral-950 p-4 text-white"
      >
        <SheetHeader className="p-0 pb-4">
          <SheetTitle className="flex items-center gap-2.5 text-left text-sm font-semibold tracking-[0.18em] text-white">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white">
              <Store className="size-3.5 text-neutral-950" />
            </span>
            UNI STORE
          </SheetTitle>
        </SheetHeader>
        <NavLinks
          onNavigate={() => setOpen(false)}
          alertaPedidos={alertaPedidos}
        />
      </SheetContent>
    </Sheet>
  )
}
