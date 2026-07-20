"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { salvarArquivo } from "@/lib/storage"
import { parseBRL } from "@/lib/money"
import { parseDataLocal } from "@/lib/data"
import type { ActionState } from "./action-state"

const itemSchema = z.object({
  modeloId: z.string().min(1, "Selecione o modelo do item"),
  cor: z.string().trim().min(1, "Informe a cor do item"),
  tamanho: z.string().trim().min(1, "Informe o tamanho do item"),
  quantidadePedida: z.number().int().positive("Quantidade inválida"),
})

const pedidoSchema = z.object({
  identificacao: z.string().trim().min(1, "Dê um nome ao pedido"),
  fornecedor: z.string().trim().optional(),
  eventoId: z.string().optional(),
  dataPedido: z.date({ message: "Informe a data do pedido" }),
  dataPrevisaoEntrega: z.date({
    message: "Informe a data prevista de recebimento",
  }),
  precoPorPeca: z.number().int().positive("Informe o preço por peça"),
  precoVendaSugerido: z.number().int().nonnegative().nullable(),
  observacoes: z.string().trim().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
})

/** Cria o pedido de produção com seus itens e (opcionalmente) a arte. */
export async function criarPedido(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  let itens: unknown
  try {
    itens = JSON.parse((formData.get("itens") as string) || "[]")
  } catch {
    return { ok: false, message: "Itens inválidos." }
  }

  const preco = parseBRL((formData.get("precoPorPeca") as string) ?? "")
  const vendaStr = ((formData.get("precoVendaSugerido") as string) ?? "").trim()
  const precoVenda = vendaStr === "" ? null : parseBRL(vendaStr)

  const parsed = pedidoSchema.safeParse({
    identificacao: formData.get("identificacao"),
    fornecedor: (formData.get("fornecedor") as string) || undefined,
    eventoId: (formData.get("eventoId") as string) || undefined,
    dataPedido: parseDataLocal((formData.get("dataPedido") as string) ?? ""),
    dataPrevisaoEntrega: parseDataLocal(
      (formData.get("dataPrevisaoEntrega") as string) ?? ""
    ),
    precoPorPeca: preco ?? 0,
    precoVendaSugerido: precoVenda,
    observacoes: (formData.get("observacoes") as string) || undefined,
    itens,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  let arte
  try {
    arte = await salvarArquivo(formData.get("arte") as File | null, "pedidos")
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  await db.pedidoProducao.create({
    data: {
      identificacao: dados.identificacao,
      fornecedor: dados.fornecedor || null,
      eventoId: dados.eventoId || null,
      dataPedido: dados.dataPedido,
      dataPrevisaoEntrega: dados.dataPrevisaoEntrega,
      precoPorPeca: dados.precoPorPeca,
      precoVendaSugerido: dados.precoVendaSugerido,
      observacoes: dados.observacoes || null,
      ...(arte && {
        arteUrl: arte.url,
        arteNome: arte.nome,
        arteTipo: arte.tipo,
      }),
      itens: { create: dados.itens },
    },
  })

  revalidatePath("/pedidos")
  revalidatePath("/dashboard")
  return { ok: true, message: "Pedido de produção registrado." }
}

const recebimentoSchema = z.array(
  z.object({
    itemId: z.string().min(1),
    quantidadeRecebida: z.number().int().nonnegative(),
  })
)

/**
 * Confirma (total ou parcialmente) o recebimento: lança a diferença no estoque,
 * criando a SKU automaticamente quando ela ainda não existe.
 */
export async function confirmarRecebimento(
  pedidoId: string,
  recebimentos: { itemId: string; quantidadeRecebida: number }[]
): Promise<ActionState> {
  const session = await requireAuth()

  const parsed = recebimentoSchema.safeParse(recebimentos)
  if (!parsed.success) {
    return { ok: false, message: "Quantidades inválidas." }
  }

  try {
    await db.$transaction(async (tx) => {
      const pedido = await tx.pedidoProducao.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      })
      if (!pedido) throw new Error("Pedido não encontrado.")
      if (pedido.status === "CANCELADO") {
        throw new Error("Pedido cancelado não pode receber entrada.")
      }

      for (const rec of parsed.data) {
        const item = pedido.itens.find((i) => i.id === rec.itemId)
        if (!item) continue

        // Só entra no estoque o que ainda não tinha sido recebido antes.
        const delta = rec.quantidadeRecebida - item.quantidadeRecebida
        if (delta === 0) continue
        if (delta < 0) {
          throw new Error(
            "A quantidade recebida não pode ser menor que a já registrada."
          )
        }

        let produto = await tx.produto.findUnique({
          where: {
            modeloId_cor_tamanho: {
              modeloId: item.modeloId,
              cor: item.cor,
              tamanho: item.tamanho,
            },
          },
        })

        if (!produto) {
          produto = await tx.produto.create({
            data: {
              modeloId: item.modeloId,
              cor: item.cor,
              tamanho: item.tamanho,
              precoVenda: pedido.precoVendaSugerido ?? 0,
              custoReferencia: pedido.precoPorPeca,
            },
          })
        }

        await tx.produto.update({
          where: { id: produto.id },
          data: { estoqueAtual: { increment: delta } },
        })
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: produto.id,
            tipo: "ENTRADA",
            origem: "PRODUCAO",
            quantidade: delta,
            custoUnitario: pedido.precoPorPeca,
            pedidoId: pedido.id,
            observacao: `Recebimento do pedido ${pedido.identificacao}`,
            usuarioId: session.user.id,
          },
        })
        await tx.pedidoProducaoItem.update({
          where: { id: item.id },
          data: { quantidadeRecebida: rec.quantidadeRecebida },
        })
      }

      const atualizado = await tx.pedidoProducaoItem.findMany({
        where: { pedidoId },
      })
      const completo = atualizado.every(
        (i) => i.quantidadeRecebida >= i.quantidadePedida
      )
      const algumRecebido = atualizado.some((i) => i.quantidadeRecebida > 0)

      await tx.pedidoProducao.update({
        where: { id: pedidoId },
        data: {
          status: completo
            ? "RECEBIDO"
            : algumRecebido
              ? "RECEBIDO_PARCIAL"
              : "ENCOMENDADO",
          dataRecebimento: algumRecebido ? new Date() : null,
        },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/pedidos")
  revalidatePath("/estoque")
  revalidatePath("/produtos")
  revalidatePath("/dashboard")
  return {
    ok: true,
    message: "Recebimento confirmado — estoque atualizado.",
  }
}

export async function cancelarPedido(pedidoId: string): Promise<ActionState> {
  await requireAuth()

  const pedido = await db.pedidoProducao.findUnique({
    where: { id: pedidoId },
    include: { itens: true },
  })
  if (!pedido) return { ok: false, message: "Pedido não encontrado." }
  if (pedido.itens.some((i) => i.quantidadeRecebida > 0)) {
    return {
      ok: false,
      message: "Não é possível cancelar: já há peças recebidas no estoque.",
    }
  }

  await db.pedidoProducao.update({
    where: { id: pedidoId },
    data: { status: "CANCELADO" },
  })

  revalidatePath("/pedidos")
  return { ok: true, message: "Pedido cancelado." }
}
