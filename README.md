# UNI STORE

Sistema de gestão de estoque, vendas e eventos para loja de vestuário jovem (UNI Movimento).

## Módulos

- **Vendas** — multi-itens, baixa automática de estoque, lucro por custo médio, cliente recorrente por CPF, vínculo opcional a evento. Só nome, produto e forma de pagamento são obrigatórios.
- **Modelos** — cadastro reutilizável com arte (PNG/JPEG/PDF); produtos referenciam o modelo, evitando erro de digitação.
- **Produtos e Estoque** — SKU = modelo + cor + tamanho; livro-razão de movimentações; venda bloqueada sem saldo.
- **Pedidos de produção** — encomenda à fábrica com itens por tamanho, arte, fornecedor, preço/peça e total calculado; alerta de atraso; ao confirmar o recebimento (aceitando quantidade divergente) as peças entram no estoque e a SKU é criada se não existir.
- **Eventos** — cadastro, duplicação e **gerador de link de reserva**: escolhe quais peças ficam disponíveis (ex.: edição limitada) e até que data/hora o link aceita pedidos; depois disso ele expira sozinho.
- **Reservas** — página pública sem login com o mesmo formato da venda (multi-item), código de reserva (R-0001) e busca por nome/telefone/código.
  - A reserva **segura as peças**: `disponível = estoqueAtual − estoqueReservado`, então o admin sabe quanto sobrou para vender no dia.
  - Na retirada dá para **ajustar as quantidades** (reservou 10, levou 8) e **dividir o pagamento** entre dinheiro, cartão e Pix.
  - Confirmada a retirada, o estoque baixa e uma **venda é gerada** (entra na receita e no lucro).
  - **Inadimplente** (não veio buscar) devolve as peças ao disponível; reservas de eventos que já passaram são encerradas automaticamente.

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript
- **PostgreSQL** (Supabase) + **Prisma 6**
- **Auth.js (NextAuth v5)** — login por credenciais
- **Tailwind CSS 4 + shadcn/ui + Lucide Icons** — fonte Barlow
- Valores monetários armazenados em **centavos** (inteiros)
- Estoque em **livro-razão**: `MovimentacaoEstoque` é a fonte de verdade; o saldo fica cacheado em `Produto.estoqueAtual`

## Como rodar

1. **Banco (Supabase, grátis):** crie um projeto em [supabase.com](https://supabase.com/dashboard) e, na tela **Connect**, copie as duas connection strings: *Transaction pooler* (porta 6543) e *Direct connection* (porta 5432).

2. **Variáveis de ambiente:**

   ```bash
   cp .env.example .env
   # preencha DATABASE_URL (pooler + ?pgbouncer=true), DIRECT_URL (direta),
   # AUTH_SECRET (npx auth secret), ADMIN_EMAIL e ADMIN_PASSWORD
   ```

   Para o **upload de artes** (modelos e pedidos), acrescente também:

   ```
   SUPABASE_URL="https://<project-ref>.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."   # cole a chave real, nao este texto
   ```

   A chave fica só no servidor (nunca vai ao browser). Sem ela o sistema
   funciona normalmente, apenas com os campos de upload desabilitados.

3. **Migração + seed** (cria o admin e dados de demonstração se o banco estiver vazio):

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   > A migração inicial também está em `supabase/migrations/` — a integração GitHub do Supabase pode aplicá-la automaticamente; nesse caso o `migrate deploy` apenas confirma que está tudo em dia.

4. **Rodar:**

   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000 e entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Deploy (Vercel)

1. Suba o repositório para o GitHub e importe na [Vercel](https://vercel.com/new).
2. Configure as variáveis `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Após o primeiro deploy, rode as migrações apontando para o banco de produção:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run db:migrate` | cria/aplica migrações (dev) |
| `npm run db:seed` | admin + dados de demonstração |
| `npm run db:studio` | Prisma Studio (inspecionar o banco) |

## Roadmap

- **Fase 1 (este MVP):** ✅
- **Fase 2:** eventos, reservas com código, pedidos em grande escala (link público + login Google), lotes de produção, página de resultados
- **Fase 3:** alertas de estoque, consolidação de pedidos → lote, exportações
- **Fase 4:** PWA offline, notificações, múltiplos usuários
