import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "./login-form"

export const metadata = { title: "Entrar — UNI STORE" }

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-lg bg-white text-2xl font-bold text-neutral-950">
            U
          </div>
          <h1 className="text-2xl font-bold tracking-[0.3em] text-white">
            UNI STORE
          </h1>
          <p className="mt-2 text-xs tracking-[0.2em] text-neutral-500 uppercase">
            Simplicidade &amp; Profundidade
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-neutral-600">
          Acesso restrito ao administrador
        </p>
      </div>
    </main>
  )
}
