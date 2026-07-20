"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { excluirModelo } from "@/server/modelos"

export function ExcluirModeloButton({
  modeloId,
  nome,
}: {
  modeloId: string
  nome: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirmar() {
    startTransition(async () => {
      const res = await excluirModelo(modeloId)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={`Excluir modelo ${nome}`}
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
          <AlertDialogDescription>
            {nome} será excluído. Modelos usados por produtos ou pedidos de
            produção não podem ser excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
