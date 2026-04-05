import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, ilike } from "drizzle-orm"
import { createProductSchema } from "@grocery/shared"
import { db } from "../db/index.ts"
import { products } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"

export const productsRouter = new Hono()

productsRouter.get("/", requireAuth, async (c) => {
  const search = c.req.query("search")
  const all = search
    ? await db
        .select()
        .from(products)
        .where(ilike(products.name, `%${search}%`))
        .orderBy(products.name)
    : await db.select().from(products).orderBy(products.name)
  return c.json(all)
})

productsRouter.post(
  "/",
  requireAuth,
  zValidator("json", createProductSchema),
  async (c) => {
    const body = c.req.valid("json")
    const [product] = await db
      .insert(products)
      .values({ id: crypto.randomUUID(), ...body })
      .returning()
    return c.json(product, 201)
  }
)

productsRouter.patch(
  "/:id",
  requireAuth,
  zValidator("json", createProductSchema.partial()),
  async (c) => {
    const { id } = c.req.param()
    const body = c.req.valid("json")
    const [product] = await db
      .update(products)
      .set(body)
      .where(eq(products.id, id))
      .returning()
    if (!product) return c.json({ error: "Product not found" }, 404)
    return c.json(product)
  }
)
