export type ActionState = {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string>
}

export const estadoInicial: ActionState = { ok: false }
