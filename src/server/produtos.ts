"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import type { CategoriaProduto } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { parseBRL } from "@/lib/money"
import { urlDoBucket } from "@/lib/storage"
import { categoria as infoCategoria, porcoesDeLitros } from "@/lib/produto"
import type { ActionState } from "./action-state"

const variacaoSchema = z.object({
  cor: z.string().trim().default(""),
  tamanho: z.string().trim().default(""),
  quantidade: z.number().int().nonnegative(),
})

const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto"),
  categoria: z.enum(["VESTUARIO", "ACESSORIO", "INSTITUCIONAL", "ALIMENTO"], {
    message: "Escolha a categoria",
  }),
  modeloId: z.string().optional(),
  descricao: z.string().trim().optional(),
  precoVenda: z.number().int().positive("Informe o preço de venda"),
  custoReferencia: z.number().int().nonnegative().nullable(),
  unidadeMedida: z.enum(["UNIDADE", "LITRO"]),
  mlPorPorcao: z.number().int().positive().nullable(),
  variacoes: z.array(variacaoSchema).min(1, "Informe ao menos uma variação"),
})

function lerImagem(formData: FormData) {
  const url = (formData.get("imagemUrl") as string) || ""
  if (!url) return null
  if (!urlDoBucket(url)) throw new Error("Imagem inválida.")
  return {
    imagemUrl: url,
    imagemNome: (formData.get("imagemNome") as string) || null,
    imagemTipo: (formData.get("imagemTipo") as string) || null,
  }
}

/** Monta o payload comum a criação e edição a partir do formulário. */
function lerFormulario(formData: FormData) {
  const preco = parseBRL((formData.get("precoVenda") as string) ?? "")
  const custoStr = ((formData.get("custoReferencia") as string) ?? "").trim()
  const custo = custoStr === "" ? null : parseBRL(custoStr)

  const unidade =
    (formData.get("unidadeMedida") as string) === "LITRO" ? "LITRO" : "UNIDADE"
  const mlStr = ((formData.get("mlPorPorcao") as string) ?? "").trim()
  const ml = mlStr === "" ? null : Number(mlStr)

  let variacoes: unknown = []
  try {
    variacoes = JSON.parse((formData.get("variacoes") as string) || "[]")
  } catch {
    variacoes = []
  }

  return produtoSchema.safeParse({
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    modeloId: (formData.get("modeloId") as string) || undefined,
    descricao: (formData.get("descricao") as string) || undefined,
    precoVenda: preco ?? 0,
    custoReferencia: custo,
    unidadeMedida: unidade,
    mlPorPorcao: ml,
    variacoes,
  })
}

/** Valida as regras que dependem da categoria escolhida. */
function validarCategoria(dados: {
  categoria: CategoriaProduto
  modeloId?: string
  unidadeMedida: string
  mlPorPorcao: number | null
}): string | null {
  const info = infoCategoria(dados.categoria)
  if (!info) return "Categoria inválida."

  if (info.usaModelo === "obrigatorio" && !dados.modeloId) {
    return `Selecione o modelo — obrigatório em ${info.label}.`
  }
  if (dados.categoria === "ALIMENTO" && dados.unidadeMedida === "LITRO") {
    if (!dados.mlPorPorcao || dados.mlPorPorcao <= 0) {
      return "Informe o tamanho do copo em ml para calcular as porções."
    }
  }
  return null
}

export async function criarProduto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth()

  const parsed = lerFormulario(formData)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }
  const dados = parsed.data

  const erroCategoria = validarCategoria(dados)
  if (erroCategoria) return { ok: false, message: erroCategoria }

  let imagem
  try {
    imagem = lerImagem(formData)
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  // Variação sem cor/tamanho repetida seria conflito de unicidade.
  const chaves = dados.variacoes.map((v) => `${v.cor}|${v.tamanho}`)
  if (new Set(chaves).size !== chaves.length) {
    return { ok: false, message: "Há variações repetidas (mesma cor e tamanho)." }
  }

  try {
    await db.$transaction(async (tx) => {
      const produto = await tx.produto.create({
        data: {
          nome: dados.nome,
          categoria: dados.categoria,
          modeloId: dados.modeloId || null,
          descricao: dados.descricao || null,
          precoVenda: dados.precoVenda,
          custoReferencia: dados.custoReferencia,
          unidadeMedida: dados.unidadeMedida,
          mlPorPorcao:
            dados.unidadeMedida === "LITRO" ? dados.mlPorPorcao : null,
          ...(imagem ?? {}),
        },
      })

      for (const v of dados.variacoes) {
        const variacao = await tx.variacao.create({
          data: {
            produtoId: produto.id,
            cor: v.cor,
            tamanho: v.tamanho,
            estoqueAtual: v.quantidade,
          },
        })
        // A quantidade informada no cadastro já entra no estoque.
        if (v.quantidade > 0) {
          await tx.movimentacaoEstoque.create({
            data: {
              variacaoId: variacao.id,
              tipo: "ENTRADA",
              origem: "AJUSTE_MANUAL",
              quantidade: v.quantidade,
              custoUnitario: dados.custoReferencia,
              observacao: "Quantidade inicial do cadastro",
              usuarioId: session.user.id,
            },
          })
        }
      }
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Já existe uma variação igual neste produto." }
    }
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: "Produto cadastrado." }
}

const edicaoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1, "Informe o nome do produto"),
  descricao: z.string().trim().optional(),
  precoVenda: z.number().int().positive("Informe o preço de venda"),
  custoReferencia: z.number().int().nonnegative().nullable(),
  modeloId: z.string().optional(),
  ativo: z.boolean(),
})

/** Edita os dados do produto; as variações e o estoque são geridos à parte. */
export async function atualizarProduto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth()

  const preco = parseBRL((formData.get("precoVenda") as string) ?? "")
  const custoStr = ((formData.get("custoReferencia") as string) ?? "").trim()
  const custo = custoStr === "" ? null : parseBRL(custoStr)

  const parsed = edicaoSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    descricao: (formData.get("descricao") as string) || undefined,
    precoVenda: preco ?? 0,
    custoReferencia: custo,
    modeloId: (formData.get("modeloId") as string) || undefined,
    ativo: formData.get("ativo") === "on",
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  let imagem
  try {
    imagem = lerImagem(formData)
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }

  const { id, nome, descricao, precoVenda, custoReferencia, modeloId, ativo } =
    parsed.data

  await db.produto.update({
    where: { id },
    data: {
      nome,
      descricao: descricao || null,
      precoVenda,
      custoReferencia,
      modeloId: modeloId || null,
      ativo,
      ...(imagem ?? {}),
    },
  })

  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: "Produto atualizado." }
}

const novaVariacaoSchema = z.object({
  produtoId: z.string().min(1),
  cor: z.string().trim().default(""),
  tamanho: z.string().trim().default(""),
  quantidade: z.number().int().nonnegative(),
})

/** Acrescenta uma cor/tamanho a um produto já cadastrado. */
export async function adicionarVariacao(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth()

  const parsed = novaVariacaoSchema.safeParse({
    produtoId: formData.get("produtoId"),
    cor: (formData.get("cor") as string) ?? "",
    tamanho: (formData.get("tamanho") as string) ?? "",
    quantidade: Number(formData.get("quantidade") ?? 0),
  })
  if (!parsed.success) {
    return { ok: false, message: "Dados da variação inválidos." }
  }
  const { produtoId, cor, tamanho, quantidade } = parsed.data

  try {
    await db.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({ where: { id: produtoId } })
      if (!produto) throw new Error("Produto não encontrado.")

      const variacao = await tx.variacao.create({
        data: { produtoId, cor, tamanho, estoqueAtual: quantidade },
      })
      if (quantidade > 0) {
        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: variacao.id,
            tipo: "ENTRADA",
            origem: "AJUSTE_MANUAL",
            quantidade,
            custoUnitario: produto.custoReferencia,
            observacao: "Quantidade inicial da variação",
            usuarioId: session.user.id,
          },
        })
      }
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Essa cor e tamanho já existem no produto." }
    }
    return { ok: false, message: (e as Error).message }
  }

  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: "Variação adicionada." }
}

/** Converte litros em porções para o formulário de alimentos. */
export async function calcularPorcoes(
  litros: number,
  mlPorPorcao: number
): Promise<number> {
  return porcoesDeLitros(litros, mlPorPorcao)
}

export async function excluirProduto(id: string): Promise<ActionState> {
  await requireAuth()

  const produto = await db.produto.findUnique({
    where: { id },
    include: {
      variacoes: {
        include: {
          _count: {
            select: { vendaItens: true, movimentacoes: true, reservaItens: true },
          },
        },
      },
    },
  })
  if (!produto) return { ok: false, message: "Produto não encontrado." }

  const comEstoque = produto.variacoes.reduce((a, v) => a + v.estoqueAtual, 0)
  if (comEstoque > 0) {
    return {
      ok: false,
      message: `Não é possível excluir: há ${comEstoque} un. em estoque. Zere o estoque com um ajuste antes.`,
    }
  }
  const temHistorico = produto.variacoes.some(
    (v) =>
      v._count.vendaItens > 0 ||
      v._count.movimentacoes > 0 ||
      v._count.reservaItens > 0
  )
  if (temHistorico) {
    return {
      ok: false,
      message:
        "Não é possível excluir: o produto tem vendas, reservas ou movimentações registradas.",
    }
  }

  await db.produto.delete({ where: { id } })
  revalidatePath("/produtos")
  revalidatePath("/estoque")
  return { ok: true, message: "Produto excluído." }
}
