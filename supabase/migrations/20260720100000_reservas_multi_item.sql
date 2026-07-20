-- Reservas multi-item que seguram estoque, pagamento dividido,
-- produtos por evento e status de inadimplência.

-- 1. Enums -------------------------------------------------------------------
ALTER TYPE "StatusReserva" RENAME TO "StatusReserva_old";
CREATE TYPE "StatusReserva" AS ENUM ('RESERVADA', 'RETIRADA', 'CANCELADA', 'INADIMPLENTE');
ALTER TABLE "Reserva"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "StatusReserva" USING ("status"::text::"StatusReserva"),
  ALTER COLUMN "status" SET DEFAULT 'RESERVADA';
DROP TYPE "StatusReserva_old";

ALTER TYPE "OrigemMovimentacao" RENAME TO "OrigemMovimentacao_old";
CREATE TYPE "OrigemMovimentacao" AS ENUM (
  'PRODUCAO', 'VENDA', 'EDICAO_VENDA', 'EXCLUSAO_VENDA', 'AJUSTE_MANUAL',
  'RETIRADA_RESERVA', 'CANCELAMENTO_RESERVA', 'VENDA_RESERVA'
);
ALTER TABLE "MovimentacaoEstoque"
  ALTER COLUMN "origem" TYPE "OrigemMovimentacao"
  USING ("origem"::text::"OrigemMovimentacao");
DROP TYPE "OrigemMovimentacao_old";

-- 2. Estoque reservado --------------------------------------------------------
ALTER TABLE "Produto" ADD COLUMN "estoqueReservado" INTEGER NOT NULL DEFAULT 0;

-- 3. Pagamento dividido na venda ---------------------------------------------
CREATE TABLE "VendaPagamento" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valor" INTEGER NOT NULL,
    CONSTRAINT "VendaPagamento_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VendaPagamento_vendaId_idx" ON "VendaPagamento"("vendaId");
ALTER TABLE "VendaPagamento" ADD CONSTRAINT "VendaPagamento_vendaId_fkey"
  FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vendas já existentes viram um pagamento único com o valor total
INSERT INTO "VendaPagamento" ("id", "vendaId", "forma", "valor")
SELECT 'vpg_' || "id", "id", "formaPagamento", "total" FROM "Venda";

-- 4. Produtos oferecidos por evento -------------------------------------------
CREATE TABLE "EventoProduto" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    CONSTRAINT "EventoProduto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventoProduto_eventoId_produtoId_key"
  ON "EventoProduto"("eventoId", "produtoId");
ALTER TABLE "EventoProduto" ADD CONSTRAINT "EventoProduto_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventoProduto" ADD CONSTRAINT "EventoProduto_produtoId_fkey"
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Reserva passa a ter itens ------------------------------------------------
CREATE TABLE "ReservaItem" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" INTEGER NOT NULL,
    CONSTRAINT "ReservaItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReservaItem_reservaId_idx" ON "ReservaItem"("reservaId");
ALTER TABLE "ReservaItem" ADD CONSTRAINT "ReservaItem_reservaId_fkey"
  FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservaItem" ADD CONSTRAINT "ReservaItem_produtoId_fkey"
  FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Move o produto/quantidade que ficava na própria reserva para os itens
INSERT INTO "ReservaItem" ("id", "reservaId", "produtoId", "quantidade", "precoUnitario")
SELECT 'rit_' || r."id", r."id", r."produtoId", r."quantidade", p."precoVenda"
FROM "Reserva" r
JOIN "Produto" p ON p."id" = r."produtoId";

ALTER TABLE "Reserva" DROP CONSTRAINT IF EXISTS "Reserva_produtoId_fkey";
ALTER TABLE "Reserva" DROP COLUMN "produtoId";
ALTER TABLE "Reserva" DROP COLUMN "quantidade";
ALTER TABLE "Reserva" DROP COLUMN "formaPagamentoEfetiva";
ALTER TABLE "Reserva" ALTER COLUMN "formaPagamento" DROP NOT NULL;

-- 6. Reserva -> venda gerada na retirada --------------------------------------
ALTER TABLE "Reserva" ADD COLUMN "vendaId" TEXT;
CREATE UNIQUE INDEX "Reserva_vendaId_key" ON "Reserva"("vendaId");
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_vendaId_fkey"
  FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Reservas em aberto passam a segurar estoque ------------------------------
UPDATE "Produto" p SET "estoqueReservado" = COALESCE(sub.qtd, 0)
FROM (
  SELECT ri."produtoId", SUM(ri."quantidade") AS qtd
  FROM "ReservaItem" ri
  JOIN "Reserva" r ON r."id" = ri."reservaId"
  WHERE r."status" = 'RESERVADA'
  GROUP BY ri."produtoId"
) sub
WHERE p."id" = sub."produtoId";
