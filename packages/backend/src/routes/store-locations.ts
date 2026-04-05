import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { createStoreLocationSchema } from "@grocery/shared"
import { db } from "../db/index.ts"
import { storeLocations, storeChains } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"

export const storeLocationsRouter = new Hono()

storeLocationsRouter.get("/", requireAuth, async (c) => {
  const rows = await db
    .select()
    .from(storeLocations)
    .leftJoin(storeChains, eq(storeLocations.chainId, storeChains.id))
    .orderBy(storeLocations.name)

  const shaped = rows.map((row) => ({
    ...row.store_location,
    chain: row.store_chain ?? null,
  }))

  return c.json(shaped)
})

storeLocationsRouter.post(
  "/",
  requireAuth,
  zValidator("json", createStoreLocationSchema),
  async (c) => {
    const body = c.req.valid("json")
    const [location] = await db
      .insert(storeLocations)
      .values({ id: crypto.randomUUID(), ...body })
      .returning()
    return c.json(location, 201)
  }
)

storeLocationsRouter.patch(
  "/:id",
  requireAuth,
  zValidator("json", createStoreLocationSchema.partial()),
  async (c) => {
    const { id } = c.req.param()
    const body = c.req.valid("json")
    const [location] = await db
      .update(storeLocations)
      .set(body)
      .where(eq(storeLocations.id, id))
      .returning()
    if (!location) return c.json({ error: "Store location not found" }, 404)
    return c.json(location)
  }
)

storeLocationsRouter.delete("/:id", requireAuth, async (c) => {
  const { id } = c.req.param()
  const [location] = await db
    .delete(storeLocations)
    .where(eq(storeLocations.id, id))
    .returning()
  if (!location) return c.json({ error: "Store location not found" }, 404)
  return c.json({ success: true })
})
