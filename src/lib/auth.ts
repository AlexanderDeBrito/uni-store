import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const senha = credentials?.senha as string | undefined
        if (!email || !senha) return null

        const usuario = await db.usuario.findUnique({ where: { email } })
        if (!usuario) return null

        const ok = await compare(senha, usuario.senhaHash)
        if (!ok) return null

        return { id: usuario.id, name: usuario.nome, email: usuario.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})

/** Garante sessão de admin em páginas e server actions; redireciona para /login. */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}
