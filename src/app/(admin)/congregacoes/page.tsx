import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CongregacaoDialog } from "./congregacao-dialog"
import { FiltroSetor } from "./filtro-setor"

export const metadata = { title: "Congregações — UNI STORE" }

export default async function CongregacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string }>
}) {
  await requireAuth()
  const { setor: setorId } = await searchParams

  const [setores, congregacoes] = await Promise.all([
    db.setor.findMany({ orderBy: { nome: "asc" } }),
    db.congregacao.findMany({
      where: setorId ? { setorId } : undefined,
      include: { setor: true },
      orderBy: [{ setor: { nome: "asc" } }, { nome: "asc" }],
    }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Congregações
          </h1>
          <p className="text-sm text-muted-foreground">
            Congregações e líderes de jovens por setor
          </p>
        </div>
        <CongregacaoDialog
          setores={setores}
          trigger={
            <Button disabled={setores.length === 0}>
              <Plus className="size-4" /> Nova congregação
            </Button>
          }
        />
      </div>

      <FiltroSetor setores={setores} setorSelecionado={setorId ?? ""} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Congregação</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Líder de Jovens
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {congregacoes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {setores.length === 0
                      ? "Cadastre um setor antes de criar congregações."
                      : "Nenhuma congregação encontrada."}
                  </TableCell>
                </TableRow>
              )}
              {congregacoes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.setor.nome}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {c.lider}
                  </TableCell>
                  <TableCell>
                    {c.ativo ? (
                      <Badge variant="secondary">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <CongregacaoDialog
                      setores={setores}
                      congregacao={c}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
