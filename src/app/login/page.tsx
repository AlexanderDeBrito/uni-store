import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "./login-form"

export const metadata = { title: "Entrar — UNI STORE" }

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
            U
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            UNI STORE
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso do administrador
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
