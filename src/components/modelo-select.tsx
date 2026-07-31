"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { criarModeloRapido } from "@/server/modelos"
import { prepararUpload } from "@/server/upload"

type Modelo = { id: string; nome: string }

/**
 * Select de modelo com opção de cadastrar um novo ali mesmo (nome + arte
 * opcional). O novo modelo é adicionado à lista local e já fica selecionado,
 * sem sair do cadastro de produto.
 */
export function ModeloSelect({
  modelos: modelosIniciais,
  value,
  onChange,
  name,
  required,
  uploadDisponivel,
}: {
  modelos: Modelo[]
  value: string
  onChange: (id: string) => void
  name?: string
  required?: boolean
  uploadDisponivel: boolean
}) {
  const [modelos, setModelos] = useState<Modelo[]>(modelosIniciais)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState("")
  const [enviandoArte, setEnviandoArte] = useState(false)
  const [arte, setArte] = useState<{
    url: string
    nome: string
    tipo: string
  } | null>(null)
  const [pending, startTransition] = useTransition()

  async function aoEscolherArte(arquivo: File) {
    setEnviandoArte(true)
    try {
      const preparo = await prepararUpload(arquivo.name, arquivo.type, "modelos")
      if (!preparo.ok) {
        toast.error(preparo.message)
        return
      }
      const resposta = await fetch(preparo.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": arquivo.type },
        body: arquivo,
      })
      if (!resposta.ok) {
        toast.error(`Falha ao enviar a arte (${resposta.status}).`)
        return
      }
      setArte({ url: preparo.publicUrl, nome: arquivo.name, tipo: arquivo.type })
    } finally {
      setEnviandoArte(false)
    }
  }

  function criar() {
    if (!nome.trim()) {
      toast.error("Informe o nome do modelo.")
      return
    }
    startTransition(async () => {
      const res = await criarModeloRapido({
        nome: nome.trim(),
        arquivoUrl: arte?.url,
        arquivoNome: arte?.nome,
        arquivoTipo: arte?.tipo,
      })
      if (res.ok && res.modelo) {
        setModelos((prev) =>
          [...prev, res.modelo!].sort((a, b) => a.nome.localeCompare(b.nome))
        )
        onChange(res.modelo.id)
        toast.success(res.message)
        setCriando(false)
        setNome("")
        setArte(null)
      } else {
        toast.error(res.message)
      }
    })
  }

  function cancelar() {
    setCriando(false)
    setNome("")
    setArte(null)
  }

  if (criando) {
    return (
      <div className="space-y-2 rounded-xl border border-neutral-300 border-dashed p-3">
        <p className="text-xs font-medium text-neutral-600">Novo modelo</p>
        <Input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do modelo"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              criar()
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={!uploadDisponivel || enviandoArte}
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              if (arquivo) aoEscolherArte(arquivo)
            }}
            className="h-9 text-xs file:mr-2 file:rounded file:border-0 file:bg-neutral-100 file:px-2 file:py-0.5 file:text-xs"
          />
          {enviandoArte && (
            <Loader2 className="size-4 shrink-0 animate-spin text-neutral-400" />
          )}
          {arte && !enviandoArte && (
            <Check className="size-4 shrink-0 text-neutral-700" />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={cancelar}>
            <X className="size-4" /> Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={criar}
            disabled={pending || enviandoArte}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Criar modelo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <NativeSelect
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex-1"
      >
        <option value="">
          {required ? "Selecione o modelo" : "Sem modelo"}
        </option>
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </NativeSelect>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Cadastrar novo modelo"
        title="Cadastrar novo modelo"
        onClick={() => setCriando(true)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
