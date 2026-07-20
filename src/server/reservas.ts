"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { limparCpf } from "@/lib/cpf"
import { custoUnitarioVariacao } from "./custo"
import type { ActionState } from "./action-state"

type Tx = Prisma.TransactionClient

/** Rótulo do item para mensagens de erro: "Camiseta Bordô — M". */
function descreverItem(
  variacao: { cor: string; tamanho: string; produto: { nome: string } } | null
): string {
  if (!variacao) return "produto"
  const detalhe = [variacao.cor, variacao.tamanho].filter(Boolean).join(" — ")
  return detalhe ? `${variacao.produto.nome} ${detalhe}` : variacao.produto.nome
}

const itemSchema = z.object({
  variacaoId: z.string().min(1),
  quantidade: z.number().int().positive(),
})

const reservaSchema = z.object({
  eventoId: z.string().min(1),
  nome: z.string().trim().min(1, "Informe seu nome"),
  telefone: z.string().trim().min(8, "Informe um telefone válido"),
  cpf: z.string().trim().optional(),
  congregacaoId: z.string().optional(),
  formaPagamento: z.enum(["CARTAO", "PIX", "DINHEIRO"]).optional(),
  observacoes: z.string().trim().optional(),
  itens: z.array(itemSchema).min(1, "Escolha pelo menos uma peça"),
})

export type ReservaPayload = z.infer<typeof reservaSchema>
export type ReservaResult = ActionState & { codigo?: string }

/**
 * Prende peças para a reserva. O estoque físico não muda — apenas o disponível,
 * que é `estoqueAtual - estoqueReservado`. O UPDATE condicional garante que duas
 * reservas simultâneas não passem do saldo.
 */
async function segurarEstoque(tx: Tx, variacaoId: string, quantidade: number) {
  const afetados = await tx.$executeRaw`
    UPDATE "Variacao"
    SET "estoqueReservado" = "estoqueReservado" + ${quantidade}
    WHERE "id" = ${variacaoId}
      AND "estoqueAtual" - "estoqueReservado" >= ${quantidade}
  `
  if (afetados === 0) {
    const v = await tx.variacao.findUnique({
      where: { id: variacaoId },
      include: { produto: true },
    })
    const disponivel = v ? v.estoqueAtual - v.estoqueReservado : 0
    throw new Error(
      `Estoque insuficiente de ${descreverItem(v)}. Disponível: ${disponivel}`
    )
  }
}

/** Devolve as peças presas ao disponível (cancelamento, inadimplência, retirada). */
async function liberarEstoque(tx: Tx, variacaoId: string, quantidade: number) {
  await tx.$executeRaw`
    UPDATE "Variacao"
    SET "estoqueReservado" = GREATEST("estoqueReservado" - ${quantidade}, 0)
    WHERE "id" = ${variacaoId}
  `
}

async function liberarItensDaReserva(tx: Tx, reservaId: string) {
  const itens = await tx.reservaItem.findMany({ where: { reservaId } })
  for (const item of itens) {
    await liberarEstoque(tx, item.variacaoId, item.quantidade)
  }
}

/** Cria reserva pelo link público (sem login) e já segura as peças. */
export async function criarReserva(payload: ReservaPayload): Promise<ReservaResult> {
  const parsed = reservaSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  const evento = await db.evento.findUnique({ where: { id: dados.eventoId } })
  if (!evento || evento.status === "ENCERRADO") {
    return { ok: false, message: "Este evento não está mais recebendo reservas." }
  }
  if (evento.prazoReserva && evento.prazoReserva < new Date()) {
    return { ok: false, message: "O prazo para reservas deste evento encerrou." }
  }

  try {
    const codigo = await db.$transaction(async (tx) => {
      const total = await tx.reserva.count()
      const codigo = `R-${String(total + 1).padStart(4, "0")}`

      const reserva = await tx.reserva.create({
        data: {
          codigo,
          nome: dados.nome,
          telefone: dados.telefone,
          cpf: dados.cpf ? limparCpf(dados.cpf) : null,
          congregacaoId: dados.congregacaoId || null,
          eventoId: dados.eventoId,
          formaPagamento: dados.formaPagamento ?? null,
          observacoes: dados.observacoes || null,
        },
      })

      for (const item of dados.itens) {
        const variacao = await tx.variacao.findUnique({
          where: { id: item.variacaoId },
          include: { produto: true },
        })
        if (!variacao) throw new Error("Produto não encontrado.")

        await segurarEstoque(tx, item.variacaoId, item.quantidade)
        await tx.reservaItem.create({
          data: {
            reservaId: reserva.id,
            variacaoId: item.variacaoId,
            quantidade: item.quantidade,
            precoUnitario: variacao.produto.precoVenda,
          },
        })
      }

      return codigo
    })

    revalidatePath("/reservas")
    revalidatePath("/estoque")
    return { ok: true, message: "Reserva registrada!", codigo }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

/**
 * Ajusta as quantidades da reserva (ex: reservou 10, vai levar 8).
 * Só é permitido enquanto a reserva estiver em aberto.
 */
export async function editarReserva(
  reservaId: string,
  itens: { itemId: string; quantidade: number }[]
): Promise<ActionState> {
  await requireAuth()

  try {
    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: { itens: true },
      })
      if (!reserva) throw new Error("Reserva não encontrada.")
      if (reserva.status !== "RESERVADA") {
        throw new Error("Só é possível alterar reservas em aberto.")
      }

      for (const alteracao of itens) {
        const item = reserva.itens.find((i) => i.id === alteracao.itemId)
        if (!item) continue

        const delta = alteracao.quantidade - item.quantidade
        if (delta > 0) await segurarEstoque(tx, item.variacaoId, delta)
        if (delta < 0) await liberarEstoque(tx, item.variacaoId, -delta)

        if (alteracao.quantidade === 0) {
          await tx.reservaItem.delete({ where: { id: item.id } })
        } else {
          await tx.reservaItem.update({
            where: { id: item.id },
            data: { quantidade: alteracao.quantidade },
          })
        }
      }

      const restantes = await tx.reservaItem.count({ where: { reservaId } })
      if (restantes === 0) {
        await tx.reserva.update({
          where: { id: reservaId },
          data: { status: "CANCELADA" },
        })
      }
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/reservas")
  revalidatePath("/estoque")
  return { ok: true, message: "Reserva atualizada." }
}

const pagamentoSchema = z
  .array(
    z.object({
      forma: z.enum(["CARTAO", "PIX", "DINHEIRO"]),
      valor: z.number().int().positive(),
    })
  )
  .min(1, "Informe ao menos uma forma de pagamento")

/**
 * Confirma a retirada: baixa o estoque de verdade, gera a venda (com o
 * pagamento eventualmente dividido) e libera a reserva.
 */
export async function confirmarRetirada(
  reservaId: string,
  pagamentos: { forma: "CARTAO" | "PIX" | "DINHEIRO"; valor: number }[]
): Promise<ActionState> {
  const session = await requireAuth()

  const parsed = pagamentoSchema.safeParse(pagamentos)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  try {
    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: { itens: { include: { variacao: { include: { produto: true } } } } },
      })
      if (!reserva) throw new Error("Reserva não encontrada.")
      if (reserva.status !== "RESERVADA") {
        throw new Error("Esta reserva já foi retirada, cancelada ou encerrada.")
      }
      if (reserva.itens.length === 0) {
        throw new Error("A reserva não tem itens.")
      }

      const total = reserva.itens.reduce(
        (acc, i) => acc + i.precoUnitario * i.quantidade,
        0
      )
      const somaPagamentos = parsed.data.reduce((acc, p) => acc + p.valor, 0)
      if (somaPagamentos !== total) {
        throw new Error(
          `A soma dos pagamentos (${(somaPagamentos / 100).toFixed(2)}) não bate com o total da reserva (${(total / 100).toFixed(2)}).`
        )
      }

      // Forma predominante fica na venda para listagem/filtro; o detalhe vai em VendaPagamento.
      const predominante = [...parsed.data].sort((a, b) => b.valor - a.valor)[0]

      const venda = await tx.venda.create({
        data: {
          clienteNome: reserva.nome,
          congregacaoId: reserva.congregacaoId,
          eventoId: reserva.eventoId,
          formaPagamento: predominante.forma,
          total,
          observacoes: `Retirada da reserva ${reserva.codigo}`,
          usuarioId: session.user.id,
        },
      })

      let lucroTotal: number | null = 0
      for (const item of reserva.itens) {
        // Sai do estoque físico e deixa de ocupar a reserva.
        const baixa = await tx.variacao.updateMany({
          where: { id: item.variacaoId, estoqueAtual: { gte: item.quantidade } },
          data: {
            estoqueAtual: { decrement: item.quantidade },
            estoqueReservado: { decrement: item.quantidade },
          },
        })
        if (baixa.count === 0) {
          throw new Error(
            `Estoque insuficiente de ${descreverItem(item.variacao)}.`
          )
        }

        const custo = await custoUnitarioVariacao(tx, item.variacaoId)
        await tx.vendaItem.create({
          data: {
            vendaId: venda.id,
            variacaoId: item.variacaoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            custoUnitario: custo,
          },
        })
        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: item.variacaoId,
            tipo: "SAIDA",
            origem: "VENDA_RESERVA",
            quantidade: item.quantidade,
            vendaId: venda.id,
            observacao: `Retirada da reserva ${reserva.codigo}`,
            usuarioId: session.user.id,
          },
        })

        if (custo === null) lucroTotal = null
        else if (lucroTotal !== null) {
          lucroTotal += (item.precoUnitario - custo) * item.quantidade
        }
      }

      await tx.vendaPagamento.createMany({
        data: parsed.data.map((p) => ({
          vendaId: venda.id,
          forma: p.forma,
          valor: p.valor,
        })),
      })
      await tx.venda.update({ where: { id: venda.id }, data: { lucroTotal } })
      await tx.reserva.update({
        where: { id: reservaId },
        data: { status: "RETIRADA", dataRetirada: new Date(), vendaId: venda.id },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/reservas")
  revalidatePath("/estoque")
  revalidatePath("/vendas")
  revalidatePath("/dashboard")
  return { ok: true, message: "Retirada confirmada — venda registrada." }
}

/** Não veio buscar: encerra a reserva e devolve as peças ao disponível. */
export async function marcarInadimplente(
  reservaId: string
): Promise<ActionState> {
  await requireAuth()

  try {
    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({ where: { id: reservaId } })
      if (!reserva) throw new Error("Reserva não encontrada.")
      if (reserva.status !== "RESERVADA") {
        throw new Error("Só reservas em aberto podem virar inadimplentes.")
      }
      await liberarItensDaReserva(tx, reservaId)
      await tx.reserva.update({
        where: { id: reservaId },
        data: { status: "INADIMPLENTE" },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/reservas")
  revalidatePath("/estoque")
  return {
    ok: true,
    message: "Reserva marcada como inadimplente — peças devolvidas ao estoque.",
  }
}

export async function cancelarReserva(reservaId: string): Promise<ActionState> {
  await requireAuth()

  try {
    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({ where: { id: reservaId } })
      if (!reserva) throw new Error("Reserva não encontrada.")
      if (reserva.status !== "RESERVADA") {
        throw new Error("Esta reserva já foi encerrada.")
      }
      await liberarItensDaReserva(tx, reservaId)
      await tx.reserva.update({
        where: { id: reservaId },
        data: { status: "CANCELADA" },
      })
    })
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/reservas")
  revalidatePath("/estoque")
  return { ok: true, message: "Reserva cancelada — peças devolvidas ao estoque." }
}

/**
 * Encerra automaticamente as reservas de eventos que já passaram e não foram
 * retiradas, devolvendo as peças. Chamado ao abrir a lista de reservas.
 */
export async function liberarReservasVencidas(): Promise<number> {
  // Compara com o início de hoje: um evento que acontece hoje ainda não venceu.
  const inicioDeHoje = new Date()
  inicioDeHoje.setHours(0, 0, 0, 0)

  const vencidas = await db.reserva.findMany({
    where: {
      status: "RESERVADA",
      evento: {
        OR: [
          { dataFim: { lt: inicioDeHoje } },
          { dataFim: null, dataInicio: { lt: inicioDeHoje } },
        ],
      },
    },
    select: { id: true },
  })
  if (vencidas.length === 0) return 0

  await db.$transaction(async (tx) => {
    for (const r of vencidas) {
      await liberarItensDaReserva(tx, r.id)
      await tx.reserva.update({
        where: { id: r.id },
        data: { status: "INADIMPLENTE" },
      })
    }
  })

  revalidatePath("/estoque")
  return vencidas.length
}
