"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, MoreVertical, UserX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cancelarReserva, marcarInadimplente } from "@/server/reservas"

/** Ações secundárias da reserva: inadimplência e cancelamento. */
export function AcoesReserva({ reservaId }: { reservaId: string }) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function executar(acao: (id: string) => Promise<{ ok: boolean; message?: string }>) {
    setOpen(false)
    startTransition(async () => {
      const res = await acao(reservaId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mais ações"
            disabled={pending}
          />
        }
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MoreVertical className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => executar(marcarInadimplente)}>
          <UserX className="size-4" />
          Não veio buscar (inadimplente)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => executar(cancelarReserva)}
          className="text-destructive"
        >
          <X className="size-4" />
          Cancelar reserva
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
