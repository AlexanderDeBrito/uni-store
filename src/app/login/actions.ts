"use server"

import { AuthError } from "next-auth"
import { signIn } from "@/lib/auth"
import type { ActionState } from "@/server/action-state"

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirectTo: "/dashboard",
    })
    return { ok: true }
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, message: "E-mail ou senha inválidos." }
    }
    throw e // NEXT_REDIRECT em caso de sucesso
  }
}
