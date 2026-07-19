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

  const produtos = await Promise.all(
    [
      { modelo: "Camiseta", cor: "Bordô", tamanho: "P", precoVenda: 4500, custoReferencia: 2200 },
      { modelo: "Camiseta", cor: "Bordô", tamanho: "M", precoVenda: 4500, custoReferencia: 2200 },
      { modelo: "Camiseta", cor: "Preta", tamanho: "G", precoVenda: 4500, custoReferencia: 2200 },
      { modelo: "Moletom", cor: "Verde", tamanho: "M", precoVenda: 12000, custoReferencia: 7000 },
      { modelo: "Moletom", cor: "Verde", tamanho: "G", precoVenda: 12000, custoReferencia: 7000 },
    ].map((p) => db.produto.create({ data: p }))
  )

  // Entrada inicial de estoque com custo de lote para cada produto demo
  for (const p of produtos) {
    const quantidade = p.modelo === "Moletom" ? 10 : 20
    await db.$transaction([
      db.movimentacaoEstoque.create({
        data: {
          produtoId: p.id,
          tipo: "ENTRADA",
          origem: "PRODUCAO",
          quantidade,
          custoUnitario: p.custoReferencia,
          observacao: "Lote inicial (demonstração)",
        },
      }),
      db.produto.update({
        where: { id: p.id },
        data: { estoqueAtual: quantidade },
      }),
    ])
  }

  console.log("Dados de demonstração criados.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
