# UNI STORE

Sistema de gestão de estoque, vendas e eventos para loja de vestuário jovem (UNI Movimento).

**Fase 1 (MVP):** login de administrador, cadastros de setores/congregações, produtos (SKU = modelo + cor + tamanho), estoque com custo por lote e histórico, vendas com baixa automática de estoque, lucro calculado e cliente recorrente por CPF.

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
