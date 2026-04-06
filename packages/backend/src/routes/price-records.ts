import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, desc, isNotNull } from "drizzle-orm"
import { createPriceRecordSchema } from "@grocery/shared"
import { db } from "../db/index.ts"
import { priceRecords, storeLocations, storeChains, products } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"

export const priceRecordsRouter = new Hono()

// GET /api/price-records/brands — all distinct brand values
priceRecordsRouter.get("/brands", requireAuth, async (c) => {
  const rows = await db
    .selectDistinct({ brand: priceRecords.brand })
    .from(priceRecords)
    .where(isNotNull(priceRecords.brand))
    .orderBy(priceRecords.brand)
  return c.json(rows.map((r) => r.brand).filter(Boolean))
})

// GET /api/price-records?productId=... — full price history for a product
priceRecordsRouter.get("/", requireAuth, async (c) => {
  const productId = c.req.query("productId")
  if (!productId) return c.json({ error: "productId query param required" }, 400)

  const rows = await db
    .select()
    .from(priceRecords)
    .innerJoin(products, eq(priceRecords.productId, products.id))
    .innerJoin(storeLocations, eq(priceRecords.storeLocationId, storeLocations.id))
    .leftJoin(storeChains, eq(storeLocations.chainId, storeChains.id))
    .where(eq(priceRecords.productId, productId))
    .orderBy(desc(priceRecords.recordedAt))

  const shaped = rows.map((row) => ({
    ...row.price_record,
    product: row.product,
    storeLocation: { ...row.store_location, chain: row.store_chain ?? null },
  }))

  return c.json(shaped)
})

// GET /api/price-records/cheapest?productId=... — most recent price per store, sorted cheapest first
priceRecordsRouter.get("/cheapest", requireAuth, async (c) => {
  const productId = c.req.query("productId")
  if (!productId) return c.json({ error: "productId query param required" }, 400)

  // Get all records for the product, then reduce to most recent per store in JS
  // (selectDistinctOn ordering is complex with the neon-http driver)
  const rows = await db
    .select()
    .from(priceRecords)
    .innerJoin(storeLocations, eq(priceRecords.storeLocationId, storeLocations.id))
    .leftJoin(storeChains, eq(storeLocations.chainId, storeChains.id))
    .where(eq(priceRecords.productId, productId))
    .orderBy(desc(priceRecords.recordedAt))

  // Deduplicate to most recent price per (store, brand) combination
  const latestPerStoreBrand = new Map<string, typeof rows[0]>()
  for (const row of rows) {
    const key = `${row.store_location.id}:${row.price_record.brand ?? ""}`
    if (!latestPerStoreBrand.has(key)) {
      latestPerStoreBrand.set(key, row)
    }
  }

  const cheapest = [...latestPerStoreBrand.values()]
    .sort((a, b) => a.price_record.price - b.price_record.price)
    .slice(0, 3)
    .map((row) => ({
      storeLocation: { ...row.store_location, chain: row.store_chain ?? null },
      brand: row.price_record.brand,
      price: row.price_record.price,
      isSpecial: row.price_record.isSpecial,
      recordedAt: row.price_record.recordedAt,
    }))

  return c.json(cheapest)
})

// POST /api/price-records — manual observation
priceRecordsRouter.post(
  "/",
  requireAuth,
  zValidator("json", createPriceRecordSchema),
  async (c) => {
    const body = c.req.valid("json")
    const userId = c.get("userId")
    const [record] = await db
      .insert(priceRecords)
      .values({
        id: crypto.randomUUID(),
        ...body,
        source: "manual",
        userId,
      })
      .returning()
    return c.json(record, 201)
  }
)
