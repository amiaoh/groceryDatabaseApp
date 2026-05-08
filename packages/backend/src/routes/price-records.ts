import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, desc, isNotNull, and, gt, inArray } from "drizzle-orm"
import { createPriceRecordSchema } from "@grocery/shared"
import { db } from "../db/index.ts"
import { priceRecords, storeLocations, storeChains, products } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"
import { scrapeProductPrice } from "../scrapers/index.ts"

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

// GET /api/price-records/cheapest?productId=...&noScrape=true|&force=true
// Returns cheapest price per chain. noScrape=true returns existing DB prices immediately with
// "loading" status for stale chains (frontend calls again without noScrape to trigger scraping).
// force=true bypasses the 1h freshness check and re-scrapes all chains.
priceRecordsRouter.get("/cheapest", requireAuth, async (c) => {
  const productId = c.req.query("productId")
  const force = c.req.query("force") === "true"
  const noScrape = c.req.query("noScrape") === "true"
  if (!productId) return c.json({ error: "productId query param required" }, 400)

  const [product] = await db.select().from(products).where(eq(products.id, productId))
  if (!product) return c.json({ error: "Product not found" }, 404)

  // Get all chains with their first store location (used as the scraping target)
  const chainWithLocations = await db
    .select({ chain: storeChains, location: storeLocations })
    .from(storeChains)
    .innerJoin(storeLocations, eq(storeLocations.chainId, storeChains.id))
    .orderBy(storeChains.name, storeLocations.name)

  const chainLocationMap = new Map<string, { chain: typeof storeChains.$inferSelect; locationId: string }>()
  for (const row of chainWithLocations) {
    if (!chainLocationMap.has(row.chain.id)) {
      chainLocationMap.set(row.chain.id, { chain: row.chain, locationId: row.location.id })
    }
  }

  const isChemistCategory = product.category === "Health & Beauty" || product.category === "Household"

  const scrapeTargets = [...chainLocationMap.values()].filter(({ chain }) => {
    const name = chain.name.toLowerCase()
    if (name.includes("woolworths") || name.includes("coles") || name.includes("aldi")) return true
    if (name.includes("chemist")) return isChemistCategory
    return false
  })

  const staleBefore = new Date(Date.now() - 60 * 60 * 1000)
  const scraperStatuses: Array<{ chainName: string; status: string }> = []

  const targetLocationIds = scrapeTargets.map((t) => t.locationId)
  const freshIds = !force && targetLocationIds.length > 0
    ? (await db
        .select({ storeLocationId: priceRecords.storeLocationId })
        .from(priceRecords)
        .where(
          and(
            eq(priceRecords.productId, productId),
            eq(priceRecords.source, "scraped"),
            gt(priceRecords.recordedAt, staleBefore),
            inArray(priceRecords.storeLocationId, targetLocationIds),
          )
        )
      ).map((r) => r.storeLocationId)
    : []

  if (!noScrape) {
    await Promise.all(
      scrapeTargets.map(async ({ chain, locationId }) => {
        if (freshIds.includes(locationId)) {
          scraperStatuses.push({ chainName: chain.name, status: "fresh" })
          return
        }

        const outcome = await scrapeProductPrice(chain, product.name)
        scraperStatuses.push({ chainName: chain.name, status: outcome.status })

        if (outcome.status !== "success") return

        await db.insert(priceRecords).values({
          id: crypto.randomUUID(),
          productId,
          storeLocationId: locationId,
          brand: outcome.data.brand,
          price: outcome.data.price,
          isSpecial: outcome.data.isSpecial,
          source: "scraped",
          productUrl: outcome.data.productUrl,
          userId: null,
        })
      })
    )
  } else {
    // Return existing DB data immediately; mark stale chains so frontend shows per-chain skeletons
    for (const { chain, locationId } of scrapeTargets) {
      scraperStatuses.push({
        chainName: chain.name,
        status: freshIds.includes(locationId) ? "fresh" : "loading",
      })
    }
  }

  const rows = await db
    .select()
    .from(priceRecords)
    .innerJoin(storeLocations, eq(priceRecords.storeLocationId, storeLocations.id))
    .leftJoin(storeChains, eq(storeLocations.chainId, storeChains.id))
    .where(eq(priceRecords.productId, productId))
    .orderBy(desc(priceRecords.recordedAt))

  // Deduplicate: one result per (chain, brand) — most recent wins (rows already sorted DESC)
  const latestPerChainBrand = new Map<string, typeof rows[0]>()
  for (const row of rows) {
    const chainId = row.store_chain?.id ?? row.store_location.id
    const key = `${chainId}:${row.price_record.brand ?? ""}`
    if (!latestPerChainBrand.has(key)) latestPerChainBrand.set(key, row)
  }

  const cheapest = [...latestPerChainBrand.values()]
    .sort((a, b) => a.price_record.price - b.price_record.price)
    .map((row) => ({
      storeLocation: { ...row.store_location, chain: row.store_chain ?? null },
      brand: row.price_record.brand,
      price: row.price_record.price,
      isSpecial: row.price_record.isSpecial,
      recordedAt: row.price_record.recordedAt,
      source: row.price_record.source,
      productUrl: row.price_record.productUrl,
    }))

  return c.json({ stores: cheapest, scraperStatuses })
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
