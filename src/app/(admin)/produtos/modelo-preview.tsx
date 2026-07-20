"use client"

import { useState } from "react"
import { FileText, ImageOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ModeloResumo = {
  nome: string
  descricao: string | null
  arquivoUrl: string | null
  arquivoNome: string | null
  arquivoTipo: string | null
}

/** Célula do grid: clique no modelo abre a arte em um modal. */
export function ModeloPreview({ modelo }: { modelo: ModeloResumo }) {
  const [open, setOpen] = useState(false)
  const ehPdf = modelo.arquivoTipo === "application/pdf"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-70"
        title="Ver arte do modelo"
      >
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
          {modelo.arquivoUrl && !ehPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={modelo.arquivoUrl}
              alt={modelo.nome}
              className="size-full object-cover"
            />
          ) : (
            <FileText className="size-4 text-neutral-500" />
          )}
        </span>
        <span className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline">
          {modelo.nome}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modelo.nome}</DialogTitle>
          </DialogHeader>
          {modelo.descricao && (
            <p className="text-sm text-neutral-500">{modelo.descricao}</p>
          )}
          {!modelo.arquivoUrl && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-neutral-50 py-12 text-neutral-400">
              <ImageOff className="size-8" />
              <p className="text-sm">Nenhuma arte enviada para este modelo.</p>
            </div>
          )}
          {modelo.arquivoUrl && ehPdf && (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 py-10">
              <FileText className="size-10 text-neutral-500" />
              <p className="text-sm text-neutral-600">{modelo.arquivoNome}</p>
              <a
                href={modelo.arquivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline"
              >
                Abrir PDF
              </a>
            </div>
          )}
          {modelo.arquivoUrl && !ehPdf && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={modelo.arquivoUrl}
              alt={modelo.nome}
              className="max-h-[60vh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
