import { createMiddleware } from "hono/factory"
import { auth } from "../auth.ts"

type AuthVariables = {
  userId: string
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401)
    }
    c.set("userId", session.user.id)
    await next()
  }
)
