import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/index.ts"
import { userDefaultStoreTargets, storeChains, storeLocations } from "../db/schema.ts"
import { requireAuth } from "../middleware/auth.ts"

export const userSettingsRouter = new Hono()

// System defaults used when a user has no saved preferences
const SYSTEM_DEFAULT_CHAIN_NAMES = ["ALDI", "Woolworths", "Coles"]

async function getOrInitDefaultTargets(userId: string) {
  const existing = await db
    .select({
      target: userDefaultStoreTargets,
      chain: storeChains,
      storeLocation: storeLocations,
    })
    .from(userDefaultStoreTargets)
    .innerJoin(storeChains, eq(userDefaultStoreTargets.chainId, storeChains.id))
    .leftJoin(storeLocations, eq(userDefaultStoreTargets.storeLocationId, storeLocations.id))
    .where(eq(userDefaultStoreTargets.userId, userId))

  if (existing.length > 0) {
    return existing.map((row) => ({
      ...row.target,
      chain: row.chain,
      storeLocation: row.storeLocation ?? null,
    }))
  }

  // First login: seed defaults from system chains
  const systemChains = await db
    .select()
    .from(storeChains)
    .then((rows) => rows.filter((c) => SYSTEM_DEFAULT_CHAIN_NAMES.includes(c.name)))

  if (systemChains.length === 0) return []

  // For each system chain, find the default store location by known name
  const DEFAULT_LOCATION_NAMES: Record<string, string> = {
    "Woolworths": "Woolworths Abbotsford",
    "Coles": "Coles Richmond Traders",
  }

  const toInsert = await Promise.all(
    systemChains.map(async (chain) => {
      let storeLocationId: string | null = null
      const defaultName = DEFAULT_LOCATION_NAMES[chain.name]
      if (defaultName) {
        const [loc] = await db
          .select()
          .from(storeLocations)
          .where(eq(storeLocations.name, defaultName))
        storeLocationId = loc?.id ?? null
      }
      return { id: crypto.randomUUID(), userId, chainId: chain.id, storeLocationId }
    })
  )

  await db.insert(userDefaultStoreTargets).values(toInsert).onConflictDoNothing()

  return getOrInitDefaultTargets(userId)
}

// GET /api/user-settings/default-stores
userSettingsRouter.get("/default-stores", requireAuth, async (c) => {
  const userId = c.get("userId")
  const targets = await getOrInitDefaultTargets(userId)
  return c.json(targets)
})

const updateDefaultStoreSchema = z.object({
  chainId: z.string(),
  storeLocationId: z.string().nullable(),
})

// PUT /api/user-settings/default-stores — upsert one chain's preferred location
userSettingsRouter.put(
  "/default-stores",
  requireAuth,
  zValidator("json", updateDefaultStoreSchema),
  async (c) => {
    const userId = c.get("userId")
    const { chainId, storeLocationId } = c.req.valid("json")

    // Validate storeLocationId belongs to the chain (if provided)
    if (storeLocationId) {
      const [loc] = await db
        .select()
        .from(storeLocations)
        .where(and(eq(storeLocations.id, storeLocationId), eq(storeLocations.chainId, chainId)))
      if (!loc) return c.json({ error: "Store location does not belong to this chain" }, 400)
    }

    await db
      .insert(userDefaultStoreTargets)
      .values({ id: crypto.randomUUID(), userId, chainId, storeLocationId })
      .onConflictDoUpdate({
        target: [userDefaultStoreTargets.userId, userDefaultStoreTargets.chainId],
        set: { storeLocationId },
      })

    const updated = await getOrInitDefaultTargets(userId)
    return c.json(updated)
  }
)
