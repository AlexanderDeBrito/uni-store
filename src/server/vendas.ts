"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { limparCpf, validarCpf } from "@/lib/cpf"
import { custoUnitarioVariacao } from "./custo"

type Tx = Prisma.TransactionClient

/** Rótulo do item para mensagens de erro: "Camiseta Bordô — M". */
function descreverItem(variacao: {
  cor: string
  tamanho: string
  produto: { nome: string }
}): string {
  const detalhe = [variacao.cor, variacao.tamanho].filter(Boolean).join(" — ")
  return detalhe ? `${variacao.produto.nome} ${detalhe}` : variacao.produto.nome
}

// Só nome do cliente, produto e forma de pagamento são obrigatórios.
const vendaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente"),
  cpf: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || validarCpf(v), "CPF inválido"),
  congregacaoId: z.string().optional(),
  liderNome: z.string().trim().optional(),
  eventoId: z.string().optional(),
  formaPagamento: z.enum(["CARTAO", "PIX", "DINHEIRO"], {
    message: "Selecione a forma de pagamento",
  }),
  observacoes: z.string().trim().optional(),
  itens: z
    .array(
      z.object({
        variacaoId: z.string().min(1),
        quantidade: z.number().int().positive(),
      })
    )
    .min(1, "Adicione pelo menos um produto"),
})

export type VendaPayload = z.infer<typeof vendaSchema>

export type VendaResult = {
  ok: boolean
  message?: string
  vendaId?: string
}

/**
 * Baixa o estoque e cria itens + movimentações da venda.
 * Retorna total e lucro (null se algum item ficou sem custo conhecido).
 */
async function aplicarItens(
  tx: Tx,
  vendaId: string,
  itens: VendaPayload["itens"],
  origem: "VENDA" | "EDICAO_VENDA",
  usuarioId: string
): Promise<{ total: number; lucroTotal: number | null }> {
  let total = 0
  let lucroTotal: number | null = 0

  for (const item of itens) {
    const variacao = await tx.variacao.findUnique({
      where: { id: item.variacaoId },
      include: { produto: true },
    })
    if (!variacao) throw new Error("Produto não encontrado.")
    const rotulo = descreverItem(variacao)

    // Venda direta só pode consumir o que não está preso em reservas.
    const baixa = await tx.$executeRaw`
      UPDATE "Variacao"
      SET "estoqueAtual" = "estoqueAtual" - ${item.quantidade}
      WHERE "id" = ${item.variacaoId}
        AND "estoqueAtual" - "estoqueReservado" >= ${item.quantidade}
    `
    if (baixa === 0) {
      const atual = await tx.variacao.findUnique({
        where: { id: item.variacaoId },
        select: { estoqueAtual: true, estoqueReservado: true },
      })
      const disponivel = atual
        ? atual.estoqueAtual - atual.estoqueReservado
        : 0
      throw new Error(
        `Estoque insuficiente de ${rotulo}. Disponível: ${disponivel}`
      )
    }

    const custo = await custoUnitarioVariacao(tx, item.variacaoId)

    await tx.vendaItem.create({
      data: {
        vendaId,
        variacaoId: item.variacaoId,
        quantidade: item.quantidade,
        precoUnitario: variacao.produto.precoVenda,
        custoUnitario: custo,
      },
    })
    await tx.movimentacaoEstoque.create({
      data: {
        variacaoId: item.variacaoId,
        tipo: "SAIDA",
        origem,
        quantidade: item.quantidade,
        vendaId,
        usuarioId,
      },
    })

    total += variacao.produto.precoVenda * item.quantidade
    if (custo === null) {
      lucroTotal = null
    } else if (lucroTotal !== null) {
      lucroTotal += (variacao.produto.precoVenda - custo) * item.quantidade
    }
  }

  return { total, lucroTotal }
}

/** Devolve ao estoque as quantidades dos itens atuais da venda. */
async function reverterItens(
  tx: Tx,
  vendaId: string,
  origem: "EDICAO_VENDA" | "EXCLUSAO_VENDA",
  usuarioId: string
) {
  const itens = await tx.vendaItem.findMany({ where: { vendaId } })
  for (const item of itens) {
    await tx.variacao.update({
      where: { id: item.variacaoId },
      data: { estoqueAtual: { increment: item.quantidade } },
    })
    await tx.movimentacaoEstoque.create({
      data: {
        variacaoId: item.variacaoId,
        tipo: "ENTRADA",
        origem,
        quantidade: item.quantidade,
        vendaId: origem === "EDICAO_VENDA" ? vendaId : null,
        observacao:
          origem === "EXCLUSAO_VENDA"
            ? `Devolução por exclusão da venda ${vendaId}`
            : "Devolução por edição da venda",
        usuarioId,
      },
    })
  }
  await tx.vendaItem.deleteMany({ where: { vendaId } })
}

/** Só mantém cadastro de cliente quando há CPF (chave do cliente recorrente). */
async function resolverCliente(tx: Tx, dados: VendaPayload) {
  const cpf = dados.cpf ? limparCpf(dados.cpf) : ""
  if (!cpf) return null

  return tx.cliente.upsert({
    where: { cpf },
    update: {
      nome: dados.nome,
      ...(dados.congregacaoId && { congregacaoId: dados.congregacaoId }),
    },
    create: {
      cpf,
      nome: dados.nome,
      congregacaoId: dados.congregacaoId || null,
    },
  })
}

export async function criarVenda(payload: VendaPayload): Promise<VendaResult> {
  const session = await requireAuth()

  const parsed = vendaSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  try {
    const vendaId = await db.$transaction(async (tx) => {
      const cliente = await resolverCliente(tx, dados)
      const venda = await tx.venda.create({
        data: {
          clienteId: cliente?.id ?? null,
          clienteNome: dados.nome,
          congregacaoId: dados.congregacaoId || null,
          liderNome: dados.liderNome || null,
          eventoId: dados.eventoId || null,
          formaPagamento: dados.formaPagamento,
          observacoes: dados.observacoes || null,
          total: 0,
          usuarioId: session.user.id,
        },
      })
      const { total, lucroTotal } = await aplicarItens(
        tx,
        venda.id,
        dados.itens,
        "VENDA",
        session.user.id
      )
      await tx.venda.update({
        where: { id: venda.id },
        data: { total, lucroTotal },
      })
      // Venda direta usa uma forma só, mas grava como pagamento para manter o
      // mesmo formato das retiradas de reserva (que podem ser divididas).
      await tx.vendaPagamento.create({
        data: { vendaId: venda.id, forma: dados.formaPagamento, valor: total },
      })
      return venda.id
    })

    revalidatePath("/vendas")
    revalidatePath("/estoque")
    revalidatePath("/dashboard")
    return { ok: true, message: "Venda registrada.", vendaId }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

export async function editarVenda(
  vendaId: string,
  payload: VendaPayload
): Promise<VendaResult> {
  const session = await requireAuth()

  const parsed = vendaSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  try {
    await db.$transaction(async (tx) => {
      const venda = await tx.venda.findUnique({ where: { id: vendaId } })
      if (!venda) throw new Error("Venda não encontrada.")

      await reverterItens(tx, vendaId, "EDICAO_VENDA", session.user.id)

      const cliente = await resolverCliente(tx, dados)
      const { total, lucroTotal } = await aplicarItens(
        tx,
        vendaId,
        dados.itens,
        "EDICAO_VENDA",
        session.user.id
      )
      await tx.venda.update({
        where: { id: vendaId },
        data: {
          clienteId: cliente?.id ?? null,
          clienteNome: dados.nome,
          congregacaoId: dados.congregacaoId || null,
          liderNome: dados.liderNome || null,
          eventoId: dados.eventoId || null,
          formaPagamento: dados.formaPagamento,
          observacoes: dados.observacoes || null,
          total,
          lucroTotal,
        },
      })
      // Refaz o pagamento com o novo total.
      await tx.vendaPagamento.deleteMany({ where: { vendaId } })
      await tx.vendaPagamento.create({
        data: { vendaId, forma: dados.formaPagamento, valor: total },
      })
    })

    revalidatePath("/vendas")
    revalidatePath("/estoque")
    revalidatePath("/dashboard")
    return { ok: true, message: "Venda atualizada.", vendaId }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

export async function excluirVenda(vendaId: string): Promise<VendaResult> {
  const session = await requireAuth()

  try {
    await db.$transaction(async (tx) => {
      const venda = await tx.venda.findUnique({ where: { id: vendaId } })
      if (!venda) throw new Error("Venda não encontrada.")

      await reverterItens(tx, vendaId, "EXCLUSAO_VENDA", session.user.id)
      await tx.venda.delete({ where: { id: vendaId } })
    })

    revalidatePath("/vendas")
    revalidatePath("/estoque")
    revalidatePath("/dashboard")
    return { ok: true, message: "Venda excluída e estoque devolvido." }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}
