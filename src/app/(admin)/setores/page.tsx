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
import { SetorDialog } from "./setor-dialog"

export const metadata = { title: "Setores — UNI STORE" }

export default async function SetoresPage() {
  await requireAuth()

  const setores = await db.setor.findMany({
    include: { _count: { select: { congregacoes: true } } },
    orderBy: { nome: "asc" },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight lg:text-3xl">
            Setores
          </h1>
          <p className="text-sm text-muted-foreground">
            Setores do UNI Movimento usados nos formulários
          </p>
        </div>
        <SetorDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Novo setor
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Região</TableHead>
                <TableHead>Congregações</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {setores.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum setor cadastrado. Crie o primeiro para liberar o
                    cadastro de congregações.
                  </TableCell>
                </TableRow>
              )}
              {setores.map((setor) => (
                <TableRow key={setor.id}>
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {setor.regiao ?? "—"}
                  </TableCell>
                  <TableCell>{setor._count.congregacoes}</TableCell>
                  <TableCell>
                    {setor.ativo ? (
                      <Badge variant="secondary">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <SetorDialog
                      setor={setor}
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
