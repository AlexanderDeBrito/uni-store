-- Modelos, Eventos, Reservas, Pedidos de Produção e campos opcionais na venda.

-- 1. Enums novos -------------------------------------------------------------
CREATE TYPE "StatusEvento" AS ENUM ('PLANEJADO', 'ATIVO', 'ENCERRADO');
CREATE TYPE "StatusReserva" AS ENUM ('RESERVADA', 'RETIRADA', 'CANCELADA');
CREATE TYPE "StatusPedidoProducao" AS ENUM ('ENCOMENDADO', 'RECEBIDO_PARCIAL', 'RECEBIDO', 'CANCELADO');

-- Recriação do enum de origem (ALTER TYPE ADD VALUE não é seguro em transação)
ALTER TYPE "OrigemMovimentacao" RENAME TO "OrigemMovimentacao_old";
CREATE TYPE "OrigemMovimentacao" AS ENUM (
  'PRODUCAO', 'VENDA', 'EDICAO_VENDA', 'EXCLUSAO_VENDA', 'AJUSTE_MANUAL',
  'RETIRADA_RESERVA', 'CANCELAMENTO_RESERVA'
);
ALTER TABLE "MovimentacaoEstoque"
  ALTER COLUMN "origem" TYPE "OrigemMovimentacao"
  USING ("origem"::text::"OrigemMovimentacao");
DROP TYPE "OrigemMovimentacao_old";

-- 2. Modelo ------------------------------------------------------------------
CREATE TABLE "Modelo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT,
    "arquivoNome" TEXT,
    "arquivoTipo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Modelo_nome_key" ON "Modelo"("nome");

-- Cria um Modelo para cada nome de modelo já usado nos produtos
INSERT INTO "Modelo" ("id", "nome", "atualizadoEm")
SELECT 'mdl_' || md5("modelo"), "modelo", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "modelo" FROM "Produto") AS distintos;

-- 3. Produto: modelo (texto) -> modeloId (FK) ---------------------------------
ALTER TABLE "Produto" ADD COLUMN "modeloId" TEXT;
UPDATE "Produto" p SET "modeloId" = m."id" FROM "Modelo" m WHERE m."nome" = p."modelo";

DROP INDEX IF EXISTS "Produto_modelo_cor_tamanho_key";
ALTER TABLE "Produto" DROP COLUMN "modelo";
ALTER TABLE "Produto" ALTER COLUMN "modeloId" SET NOT NULL;
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_modeloId_fkey"
  FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Produto_modeloId_cor_tamanho_key" ON "Produto"("modeloId", "cor", "tamanho");

-- 4. Cliente: CPF passa a ser opcional ---------------------------------------
ALTER TABLE "Cliente" ALTER COLUMN "cpf" DROP NOT NULL;
ALTER TABLE "Cliente" ADD COLUMN "telefone" TEXT;

-- 5. Evento ------------------------------------------------------------------
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "prazoReserva" TIMESTAMP(3),
    "status" "StatusEvento" NOT NULL DEFAULT 'PLANEJADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Evento_slug_key" ON "Evento"("slug");

-- 6. Venda: cliente/congregação opcionais + nome direto + evento --------------
ALTER TABLE "Venda" ADD COLUMN "clienteNome" TEXT;
UPDATE "Venda" v SET "clienteNome" = c."nome" FROM "Cliente" c WHERE c."id" = v."clienteId";
UPDATE "Venda" SET "clienteNome" = 'Cliente' WHERE "clienteNome" IS NULL;
ALTER TABLE "Venda" ALTER COLUMN "clienteNome" SET NOT NULL;

ALTER TABLE "Venda" ALTER COLUMN "clienteId" DROP NOT NULL;
ALTER TABLE "Venda" ALTER COLUMN "congregacaoId" DROP NOT NULL;
ALTER TABLE "Venda" ALTER COLUMN "liderNome" DROP NOT NULL;
ALTER TABLE "Venda" ADD COLUMN "eventoId" TEXT;
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Pedido de Produção ------------------------------------------------------
CREATE TABLE "PedidoProducao" (
    "id" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "fornecedor" TEXT,
    "eventoId" TEXT,
    "dataPedido" TIMESTAMP(3) NOT NULL,
    "dataPrevisaoEntrega" TIMESTAMP(3) NOT NULL,
    "dataRecebimento" TIMESTAMP(3),
    "precoPorPeca" INTEGER NOT NULL,
    "precoVendaSugerido" INTEGER,
    "arteUrl" TEXT,
    "arteNome" TEXT,
    "arteTipo" TEXT,
    "status" "StatusPedidoProducao" NOT NULL DEFAULT 'ENCOMENDADO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PedidoProducao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PedidoProducao_status_dataPrevisaoEntrega_idx"
  ON "PedidoProducao"("status", "dataPrevisaoEntrega");
ALTER TABLE "PedidoProducao" ADD CONSTRAINT "PedidoProducao_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PedidoProducaoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidadePedida" INTEGER NOT NULL,
    "quantidadeRecebida" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PedidoProducaoItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PedidoProducaoItem_pedidoId_idx" ON "PedidoProducaoItem"("pedidoId");
ALTER TABLE "PedidoProducaoItem" ADD CONSTRAINT "PedidoProducaoItem_pedidoId_fkey"
  FOREIGN KEY ("pedidoId") REFERENCES "PedidoProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PedidoProducaoItem" ADD CONSTRAINT "PedidoProducaoItem_modeloId_fkey"
  FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Reserva -----------------------------------------------------------------
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cpf" TEXT,
    "congregacaoId" TEXT,
    "eventoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "formaPagamentoEfetiva" "FormaPagamento",
    "status" "StatusReserva" NOT NULL DEFAULT 'RESERVADA',
    "observacoes" TEXT,
    "dataReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRetirada" TIMESTAMP(3),
    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reserva_codigo_key" ON "Reserva"("codigo");
CREATE INDEX "Reserva_eventoId_status_idx" ON "Reserva"("eventoId", "status");
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_produtoId_fkey"
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_congregacaoId_fkey"
  FOREIGN KEY ("congregacaoId") REFERENCES "Congregacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. Movimentação vinculada ao pedido de produção -----------------------------
ALTER TABLE "MovimentacaoEstoque" ADD COLUMN "pedidoId" TEXT;
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_pedidoId_fkey"
  FOREIGN KEY ("pedidoId") REFERENCES "PedidoProducao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
