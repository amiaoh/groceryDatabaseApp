import type { StoreChain } from "@grocery/shared"
import type { ScrapedPrice } from "./types.ts"
import { scrapeWoolworths } from "./woolworths.ts"
import { scrapeColes } from "./coles.ts"
import { scrapeAldi } from "./aldi.ts"
import { scrapeChemistWarehouse } from "./chemist-warehouse.ts"

export type { ScrapedPrice }

export type ScrapeOutcome =
  | { status: "success"; data: ScrapedPrice }
  | { status: "failed" }
  | { status: "skipped" }

const SCRAPER_TIMEOUT_MS = 20_000

function withTimeout(promise: Promise<ScrapedPrice | null>): Promise<ScrapedPrice | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), SCRAPER_TIMEOUT_MS)),
  ])
}

export async function scrapeProductPrice(
  chain: Pick<StoreChain, "name">,
  productName: string,
): Promise<ScrapeOutcome> {
  try {
    const name = chain.name.toLowerCase()
    let data: ScrapedPrice | null = null
    if (name.includes("woolworths")) data = await withTimeout(scrapeWoolworths(productName))
    else if (name.includes("coles")) data = await withTimeout(scrapeColes(productName))
    else if (name.includes("aldi")) data = await withTimeout(scrapeAldi(productName))
    else if (name.includes("chemist")) data = await withTimeout(scrapeChemistWarehouse(productName))
    else return { status: "skipped" }

    return data !== null ? { status: "success", data } : { status: "failed" }
  } catch {
    return { status: "failed" }
  }
}
