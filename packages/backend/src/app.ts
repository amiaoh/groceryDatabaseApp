import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./auth.ts"
import { storeChainsRouter } from "./routes/store-chains.ts"
import { storeLocationsRouter } from "./routes/store-locations.ts"
import { productsRouter } from "./routes/products.ts"
import { priceRecordsRouter } from "./routes/price-records.ts"
import { userSettingsRouter } from "./routes/user-settings.ts"

const app = new Hono()

app.use(
  "/api/*",
  cors({
    origin: (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, ""),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
)

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw))

app.route("/api/store-chains", storeChainsRouter)
app.route("/api/store-locations", storeLocationsRouter)
app.route("/api/products", productsRouter)
app.route("/api/price-records", priceRecordsRouter)
app.route("/api/user-settings", userSettingsRouter)

export default app
