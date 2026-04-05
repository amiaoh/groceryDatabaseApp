/**
 * One-time migration script: moves data from legacy Store/Deal tables
 * into the new StoreChain / StoreLocation / Product / PriceRecord tables.
 *
 * Run with:
 *   cd packages/backend && tsx --env-file=.env src/db/migrate-legacy.ts
 *
 * Safe to run multiple times — uses onConflictDoNothing throughout.
 * Delete this file once migration is confirmed successful.
 */

import {
  legacyDeals,
  legacyStores,
  priceRecords,
  products,
  storeChains,
  storeLocations,
} from "./schema.ts";

import { db } from "./index.ts";

// Edit this list to match the chain stores in your database.
// Any store whose name STARTS WITH one of these (case-insensitive) will be
// linked to that chain. Others are treated as independent stores.
const KNOWN_CHAINS: { name: string; websiteUrl: string }[] = [
  { name: "Woolworths", websiteUrl: "https://www.woolworths.com.au" },
  { name: "Coles", websiteUrl: "https://www.coles.com.au" },
  { name: "ALDI", websiteUrl: "https://www.aldi.com.au" },
  { name: "Aldi", websiteUrl: "https://www.aldi.com.au" },
  { name: "IGA", websiteUrl: "https://www.iga.com.au" },
  { name: "KFL", websiteUrl: "https://www.kflsupermarkets.com.au/" },
  { name: "Harris Farm", websiteUrl: "https://www.harrisfarm.com.au" },
  { name: "Costco", websiteUrl: "https://www.costco.com.au" },
]

function detectChain(storeName: string) {
  return KNOWN_CHAINS.find((chain) =>
    storeName.toLowerCase().startsWith(chain.name.toLowerCase())
  )
}

async function migrate() {
  console.log("Reading legacy stores...")
  const oldStores = await db.select().from(legacyStores)
  console.log(`Found ${oldStores.length} stores`)

  // 1. Seed StoreChains for detected chains
  const detectedChains = new Map<string, (typeof KNOWN_CHAINS)[0]>()
  for (const store of oldStores) {
    const chain = detectChain(store.displayName)
    if (chain) detectedChains.set(chain.name, chain)
  }

  const chainIdByName = new Map<string, string>()
  for (const [chainName, chain] of detectedChains) {
    const [inserted] = await db
      .insert(storeChains)
      .values({
        id: crypto.randomUUID(),
        name: chainName,
        websiteUrl: chain.websiteUrl || null,
      })
      .onConflictDoNothing()
      .returning()

    if (inserted) {
      chainIdByName.set(chainName, inserted.id)
      console.log(`Created chain: ${chainName}`)
    } else {
      // Already existed — fetch the id
      const existing = await db.query.storeChains.findFirst({
        where: (t, { eq }) => eq(t.name, chainName),
      })
      if (existing) chainIdByName.set(chainName, existing.id)
    }
  }

  // 2. Migrate StoreLocations
  const storeLocationIdByLegacyId = new Map<string, string>()
  for (const store of oldStores) {
    const chain = detectChain(store.displayName)
    const chainId = chain ? chainIdByName.get(chain.name) ?? null : null
    const newId = crypto.randomUUID()

    const [inserted] = await db
      .insert(storeLocations)
      .values({
        id: newId,
        name: store.displayName,
        chainId,
        suburb: store.suburb,
        state: null,
        address: null,
      })
      .onConflictDoNothing()
      .returning()

    const locationId = inserted?.id ?? newId
    storeLocationIdByLegacyId.set(store.id, locationId)
    console.log(`Migrated store: ${store.displayName}`)
  }

  // 3. Migrate Products from unique deal items
  console.log("\nReading legacy deals...")
  const oldDeals = await db.select().from(legacyDeals)
  console.log(`Found ${oldDeals.length} deals`)

  const productIdByName = new Map<string, string>()
  const uniqueItems = new Map<string, string>() // item → unitType
  for (const deal of oldDeals) {
    if (!uniqueItems.has(deal.item)) {
      uniqueItems.set(deal.item, deal.unitType)
    }
  }

  for (const [itemName, unitType] of uniqueItems) {
    const validUnit = ["kg", "L", "unit"].includes(unitType)
      ? (unitType as "kg" | "L" | "unit")
      : "unit"

    const newId = crypto.randomUUID()
    const [inserted] = await db
      .insert(products)
      .values({
        id: newId,
        name: itemName,
        unitType: validUnit,
        category: null,
      })
      .onConflictDoNothing()
      .returning()

    const productId = inserted?.id ?? newId
    productIdByName.set(itemName, productId)
    console.log(`Migrated product: ${itemName}`)
  }

  // 4. Migrate PriceRecords
  for (const deal of oldDeals) {
    const productId = productIdByName.get(deal.item)
    const storeLocationId = storeLocationIdByLegacyId.get(deal.storeId)

    if (!productId || !storeLocationId) {
      console.warn(`Skipping deal ${deal.id} — missing product or store mapping`)
      continue
    }

    await db
      .insert(priceRecords)
      .values({
        id: crypto.randomUUID(),
        productId,
        storeLocationId,
        price: deal.pricePerUnit,
        isSpecial: false,
        validUntil: null,
        source: "manual",
        recordedAt: new Date(deal.dateObserved),
        productUrl: null,
        userId: null,
      })
      .onConflictDoNothing()

    console.log(`Migrated deal: ${deal.item} at store ${deal.storeId}`)
  }

  console.log("\nMigration complete.")
  console.log(
    "Once verified, remove the legacyStores/legacyDeals from schema.ts and run db:push --force to drop the old tables."
  )
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
