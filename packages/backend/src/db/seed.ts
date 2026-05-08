// Run with: pnpm tsx --env-file=.env src/db/seed.ts
// Inserts the 3 default chains and 2 default store locations if they don't exist.
import "dotenv/config"
import { db } from "./index.ts"
import { storeChains, storeLocations } from "./schema.ts"
import { eq } from "drizzle-orm"

async function upsertChain(name: string, websiteUrl: string | null, isNational: boolean) {
  const [existing] = await db.select().from(storeChains).where(eq(storeChains.name, name))
  if (existing) {
    await db.update(storeChains).set({ isNational }).where(eq(storeChains.id, existing.id))
    return existing
  }
  const [created] = await db
    .insert(storeChains)
    .values({ id: crypto.randomUUID(), name, websiteUrl, isNational })
    .returning()
  return created
}

async function upsertLocation(
  name: string,
  chainId: string,
  suburb: string | null,
  state: string | null,
) {
  const [existing] = await db.select().from(storeLocations).where(eq(storeLocations.name, name))
  if (existing) return existing
  const [created] = await db
    .insert(storeLocations)
    .values({ id: crypto.randomUUID(), name, chainId, suburb, state, address: null })
    .returning()
  return created
}

async function seed() {
  const aldi = await upsertChain("ALDI", "https://www.aldi.com.au", true)
  const woolworths = await upsertChain("Woolworths", "https://www.woolworths.com.au", false)
  const coles = await upsertChain("Coles", "https://www.coles.com.au", false)
  const chemistWarehouse = await upsertChain("Chemist Warehouse", "https://www.chemistwarehouse.com.au", true)

  // National chains get one representative location for scraped price records
  await upsertLocation("ALDI", aldi.id, null, null)
  await upsertLocation("Woolworths Abbotsford", woolworths.id, "Abbotsford", "VIC")
  await upsertLocation("Coles Richmond Traders", coles.id, "Richmond", "VIC")
  await upsertLocation("Chemist Warehouse", chemistWarehouse.id, null, null)

  console.log("Seed complete")
  process.exit(0)
}

seed().catch((err) => { console.error(err); process.exit(1) })
