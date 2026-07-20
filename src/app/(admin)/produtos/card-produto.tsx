"use client"

import { useState } from "react"
import { Boxes, Info, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImagemProduto } from "@/components/imagem-produto"
import { formatarBRL } from "@/lib/money"
import { descreverVariacao, labelCategoria } from "@/lib/produto"
import { EditarProdutoDialog } from "./editar-produto-dialog"
import { ExcluirProdutoButton } from "./excluir-produto"

export type ProdutoCard = {
  id: string
  nome: string
  categoria: string
  descricao: string | null
  precoVenda: number
  custoReferencia: number | null
  imagemUrl: string | null
  imagemTipo: string | null
  imagemNome: string | null
  ativo: boolean
  unidadeMedida: string
  mlPorPorcao: number | null
  modeloId: string | null
  modelo: { nome: string; arquivoUrl: string | null; arquivoTipo: string | null } | null
  variacoes: {
    id: string
    cor: string
    tamanho: string
    estoqueAtual: number
    estoqueReservado: number
  }[]
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="eyebrow mb-0.5">{rotulo}</p>
      <p className="text-sm text-neutral-800">{valor}</p>
    </div>
  )
}

export function CardProduto({
  produto,
  modelos,
  uploadDisponivel,
}: {
  produto: ProdutoCard
  modelos: { id: string; nome: string }[]
  uploadDisponivel: boolean
}) {
  const [aberto, setAberto] = useState(false)

  const estoque = produto.variacoes.reduce((a, v) => a + v.estoqueAtual, 0)
  const reservado = produto.variacoes.reduce((a, v) => a + v.estoqueReservado, 0)
  const disponivel = estoque - reservado

  return (
    <>
      <div className="card-surface flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="relative aspect-square w-full overflow-hidden transition-opacity hover:opacity-90"
          title="Ver detalhes"
        >
          <ImagemProduto fonte={produto} alt={produto.nome} />
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-700 uppercase backdrop-blur">
            {labelCategoria(produto.categoria)}
          </span>
          {!produto.ativo && (
            <span className="absolute top-2 right-2 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              Inativo
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col p-4">
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="text-left"
          >
            <p className="truncate font-semibold text-neutral-900 hover:underline">
              {produto.nome}
            </p>
          </button>
          <p className="mt-0.5 text-lg font-bold text-neutral-900">
            {formatarBRL(produto.precoVenda)}
          </p>

          {produto.variacoes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {produto.variacoes.slice(0, 4).map((v) => (
                <span
                  key={v.id}
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    v.estoqueAtual - v.estoqueReservado <= 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                  title={`${descreverVariacao(v)}: ${v.estoqueAtual - v.estoqueReservado} disponível(is)`}
                >
                  {descreverVariacao(v)} · {v.estoqueAtual - v.estoqueReservado}
                </span>
              ))}
              {produto.variacoes.length > 4 && (
                <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-500">
                  +{produto.variacoes.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Boxes className="size-3.5" />
              {disponivel} disp.
              {reservado > 0 && ` · ${reservado} res.`}
            </span>
            <div className="flex gap-1">
              <EditarProdutoDialog
                produto={produto}
                modelos={modelos}
                uploadDisponivel={uploadDisponivel}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Editar produto">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <ExcluirProdutoButton
                produtoId={produto.id}
                descricao={produto.nome}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="size-5" /> {produto.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="aspect-video overflow-hidden rounded-xl">
              <ImagemProduto fonte={produto} alt={produto.nome} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Campo rotulo="Nome do produto" valor={produto.nome} />
              <Campo
                rotulo="Categoria"
                valor={labelCategoria(produto.categoria)}
              />
              <Campo
                rotulo="Preço de venda"
                valor={formatarBRL(produto.precoVenda)}
              />
              <Campo
                rotulo="Custo de referência"
                valor={formatarBRL(produto.custoReferencia)}
              />
              {produto.modelo && (
                <Campo rotulo="Modelo" valor={produto.modelo.nome} />
              )}
              {produto.unidadeMedida === "LITRO" && produto.mlPorPorcao && (
                <Campo
                  rotulo="Porção"
                  valor={`${produto.mlPorPorcao} ml por copo`}
                />
              )}
            </div>

            {produto.descricao && (
              <Campo rotulo="Descrição" valor={produto.descricao} />
            )}

            <div>
              <p className="eyebrow mb-2">
                Variações e estoque ({produto.variacoes.length})
              </p>
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-100">
                    {produto.variacoes.map((v) => {
                      const disp = v.estoqueAtual - v.estoqueReservado
                      return (
                        <tr key={v.id}>
                          <td className="px-3 py-2.5 text-neutral-800">
                            {descreverVariacao(v)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-neutral-500">
                            {v.estoqueReservado > 0 &&
                              `${v.estoqueReservado} reservada(s)`}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-semibold ${
                              disp <= 0 ? "text-destructive" : ""
                            }`}
                          >
                            {disp} disp.
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-end justify-between rounded-xl bg-neutral-950 p-4 text-white">
              <div>
                <p className="text-xs tracking-widest text-neutral-400 uppercase">
                  Em estoque
                </p>
                <p className="text-2xl font-bold">{estoque}</p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-widest text-neutral-400 uppercase">
                  Disponível para venda
                </p>
                <p className="text-lg font-semibold">{disponivel}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
