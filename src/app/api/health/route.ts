import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Diagnóstico: confirma se a aplicação alcança o banco de dados. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ db: "ok" })
  } catch (e) {
    const erro = e as Error
    return Response.json(
      { db: "erro", tipo: erro.name, detalhe: erro.message.slice(0, 200) },
      { status: 500 }
    )
  }
}
