import { handle } from "hono/vercel"
import app from "./app.ts"

export const runtime = "nodejs"
export default handle(app)
