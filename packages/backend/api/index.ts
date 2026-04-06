import { handle } from "hono/vercel"
import app from "../src/app.ts"

export const runtime = "nodejs"

export default handle(app)
