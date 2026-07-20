-- Produto passa a ser o item da vitrine (nome, categoria, preço, imagem) e as
-- cores/tamanhos/estoque vão para Variacao.
--
-- Cada Produto atual (que hoje é uma SKU) vira uma Variacao COM O MESMO id, de
-- modo que as FKs de vendas, reservas, movimentações e eventos continuem
-- apontando para o registro certo sem reescrever valores.

CREATE TYPE "CategoriaProduto" AS ENUM ('VESTUARIO', 'ACESSORIO', 'INSTITUCIONAL', 'ALIMENTO');
CREATE TYPE "UnidadeMedida" AS ENUM ('UNIDADE', 'LITRO');

-- 1. Novo Produto (pai) ------------------------------------------------------
CREATE TABLE "ProdutoNovo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaProduto" NOT NULL,
    "modeloId" TEXT,
    "descricao" TEXT,
    "precoVenda" INTEGER NOT NULL,
    "custoReferencia" INTEGER,
    "imagemUrl" TEXT,
    "imagemNome" TEXT,
    "imagemTipo" TEXT,
    "unidadeMedida" "UnidadeMedida" NOT NULL DEFAULT 'UNIDADE',
    "mlPorPorcao" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProdutoNovo_pkey" PRIMARY KEY ("id")
);

-- Um pai por (modelo + preço): preserva preços diferentes do mesmo modelo.
INSERT INTO "ProdutoNovo" (
  "id", "nome", "categoria", "modeloId", "precoVenda", "custoReferencia", "atualizadoEm"
)
SELECT
  'prd_' || md5(p."modeloId" || '-' || p."precoVenda"::text),
  m."nome",
  'VESTUARIO'::"CategoriaProduto",
  p."modeloId",
  p."precoVenda",
  MAX(p."custoReferencia"),
  CURRENT_TIMESTAMP
FROM "Produto" p
JOIN "Modelo" m ON m."id" = p."modeloId"
GROUP BY p."modeloId", p."precoVenda", m."nome";

-- 2. Variacao ----------------------------------------------------------------
CREATE TABLE "Variacao" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '',
    "tamanho" TEXT NOT NULL DEFAULT '',
    "estoqueAtual" INTEGER NOT NULL DEFAULT 0,
    "estoqueReservado" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Variacao_pkey" PRIMARY KEY ("id")
);

-- Mantém o id antigo para não invalidar nenhuma FK existente.
INSERT INTO "Variacao" ("id", "produtoId", "cor", "tamanho", "estoqueAtual", "estoqueReservado")
SELECT
  p."id",
  'prd_' || md5(p."modeloId" || '-' || p."precoVenda"::text),
  COALESCE(p."cor", ''),
  COALESCE(p."tamanho", ''),
  p."estoqueAtual",
  p."estoqueReservado"
FROM "Produto" p;

CREATE UNIQUE INDEX "Variacao_produtoId_cor_tamanho_key"
  ON "Variacao"("produtoId", "cor", "tamanho");
ALTER TABLE "Variacao" ADD CONSTRAINT "Variacao_produtoId_fkey"
  FOREIGN KEY ("produtoId") REFERENCES "ProdutoNovo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Repontar as FKs de Produto para Variacao ---------------------------------
ALTER TABLE "MovimentacaoEstoque" DROP CONSTRAINT "MovimentacaoEstoque_produtoId_fkey";
DROP INDEX IF EXISTS "MovimentacaoEstoque_produtoId_data_idx";
ALTER TABLE "MovimentacaoEstoque" RENAME COLUMN "produtoId" TO "variacaoId";
CREATE INDEX "MovimentacaoEstoque_variacaoId_data_idx" ON "MovimentacaoEstoque"("variacaoId", "data");
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_variacaoId_fkey"
  FOREIGN KEY ("variacaoId") REFERENCES "Variacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VendaItem" DROP CONSTRAINT "VendaItem_produtoId_fkey";
DROP INDEX IF EXISTS "VendaItem_produtoId_idx";
ALTER TABLE "VendaItem" RENAME COLUMN "produtoId" TO "variacaoId";
CREATE INDEX "VendaItem_variacaoId_idx" ON "VendaItem"("variacaoId");
ALTER TABLE "VendaItem" ADD CONSTRAINT "VendaItem_variacaoId_fkey"
  FOREIGN KEY ("variacaoId") REFERENCES "Variacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReservaItem" DROP CONSTRAINT "ReservaItem_produtoId_fkey";
ALTER TABLE "ReservaItem" RENAME COLUMN "produtoId" TO "variacaoId";
ALTER TABLE "ReservaItem" ADD CONSTRAINT "ReservaItem_variacaoId_fkey"
  FOREIGN KEY ("variacaoId") REFERENCES "Variacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventoProduto" DROP CONSTRAINT "EventoProduto_produtoId_fkey";
DROP INDEX IF EXISTS "EventoProduto_eventoId_produtoId_key";
ALTER TABLE "EventoProduto" RENAME COLUMN "produtoId" TO "variacaoId";
CREATE UNIQUE INDEX "EventoProduto_eventoId_variacaoId_key"
  ON "EventoProduto"("eventoId", "variacaoId");
ALTER TABLE "EventoProduto" ADD CONSTRAINT "EventoProduto_variacaoId_fkey"
  FOREIGN KEY ("variacaoId") REFERENCES "Variacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Troca a tabela antiga pela nova -------------------------------------------
DROP TABLE "Produto";
ALTER TABLE "ProdutoNovo" RENAME TO "Produto";
ALTER TABLE "Produto" RENAME CONSTRAINT "ProdutoNovo_pkey" TO "Produto_pkey";
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_modeloId_fkey"
  FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Produto_categoria_idx" ON "Produto"("categoria");

-- Recria a FK de Variacao apontando para o nome final da tabela
ALTER TABLE "Variacao" DROP CONSTRAINT "Variacao_produtoId_fkey";
ALTER TABLE "Variacao" ADD CONSTRAINT "Variacao_produtoId_fkey"
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
