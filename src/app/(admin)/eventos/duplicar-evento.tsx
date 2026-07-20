"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { duplicarEvento } from "@/server/eventos"

export function DuplicarEventoButton({ eventoId }: { eventoId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await duplicarEvento(eventoId)
          if (res.ok) toast.success(res.message)
          else toast.error(res.message)
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Copy className="size-4" />
      )}
      Duplicar
    </Button>
  )
}
