import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@unistore.com"
  const senha = process.env.ADMIN_PASSWORD ?? "trocar-esta-senha"

  await db.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Administrador",
      email,
      senhaHash: await hash(senha, 10),
    },
  })
  console.log(`Admin garantido: ${email}`)

  // Dados de demonstração — criados apenas se o banco estiver vazio,
  // para a beta já abrir navegável. Podem ser editados/excluídos na UI.
  const temSetores = await db.setor.count()
  if (temSetores > 0) {
    console.log("Banco já possui dados; demo ignorada.")
    return
  }

  const centro = await db.setor.create({
    data: { nome: "Setor Centro", regiao: "Região 1" },
  })
  const leste = await db.setor.create({
    data: { nome: "Setor Leste", regiao: "Região 1" },
  })

  await db.congregacao.createMany({
    data: [
      { nome: "Congregação Central", setorId: centro.id, lider: "Ana Souza" },
      { nome: "Congregação Vila Nova", setorId: centro.id, lider: "Pedro Lima" },
      { nome: "Congregação Jardim", setorId: leste.id, lider: "Maria Silva" },
    ],
  })

  const camiseta = await db.modelo.create({
    data: { nome: "Camiseta", descricao: "Modelo básico de demonstração" },
  })
  const moletom = await db.modelo.create({
    data: { nome: "Moletom", descricao: "Modelo de demonstração" },
  })

  // Produtos da vitrine com suas variações e estoque inicial
  const catalogo = [
    {
      nome: "Camiseta",
      modeloId: camiseta.id,
      precoVenda: 4500,
      custoReferencia: 2200,
      variacoes: [
        { cor: "Bordô", tamanho: "P", quantidade: 20 },
        { cor: "Bordô", tamanho: "M", quantidade: 20 },
        { cor: "Preta", tamanho: "G", quantidade: 20 },
      ],
    },
    {
      nome: "Moletom",
      modeloId: moletom.id,
      precoVenda: 12000,
      custoReferencia: 7000,
      variacoes: [
        { cor: "Verde", tamanho: "M", quantidade: 10 },
        { cor: "Verde", tamanho: "G", quantidade: 10 },
      ],
    },
  ]

  for (const item of catalogo) {
    const produto = await db.produto.create({
      data: {
        nome: item.nome,
        categoria: "VESTUARIO",
        modeloId: item.modeloId,
        precoVenda: item.precoVenda,
        custoReferencia: item.custoReferencia,
      },
    })
    for (const v of item.variacoes) {
      const variacao = await db.variacao.create({
        data: {
          produtoId: produto.id,
          cor: v.cor,
          tamanho: v.tamanho,
          estoqueAtual: v.quantidade,
        },
      })
      await db.movimentacaoEstoque.create({
        data: {
          variacaoId: variacao.id,
          tipo: "ENTRADA",
          origem: "PRODUCAO",
          quantidade: v.quantidade,
          custoUnitario: item.custoReferencia,
          observacao: "Lote inicial (demonstração)",
        },
      })
    }
  }

  console.log("Dados de demonstração criados.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
