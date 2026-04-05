import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { createStoreChainSchema } from "@grocery/shared"
import { db } from "../db/index.ts"
import { storeChains } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"

export const storeChainsRouter = new Hono()

storeChainsRouter.get("/", requireAuth, async (c) => {
  const all = await db.select().from(storeChains).orderBy(storeChains.name)
  return c.json(all)
})

storeChainsRouter.post(
  "/",
  requireAuth,
  zValidator("json", createStoreChainSchema),
  async (c) => {
    const body = c.req.valid("json")
    const [chain] = await db
      .insert(storeChains)
      .values({ id: crypto.randomUUID(), ...body })
      .returning()
    return c.json(chain, 201)
  }
)

storeChainsRouter.patch(
  "/:id",
  requireAuth,
  zValidator("json", createStoreChainSchema.partial()),
  async (c) => {
    const { id } = c.req.param()
    const body = c.req.valid("json")
    const [chain] = await db
      .update(storeChains)
      .set(body)
      .where(eq(storeChains.id, id))
      .returning()
    if (!chain) return c.json({ error: "Store chain not found" }, 404)
    return c.json(chain)
  }
)
