import type { ScrapedPrice } from "./types.ts"

// Cache the Next.js build ID so we don't fetch the homepage on every search
let cachedBuildId: string | null = null
let buildIdFetchedAt = 0
const BUILD_ID_TTL_MS = 60 * 60 * 1000 // 1 hour

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-AU,en;q=0.9",
}

async function getColesNextBuildId(): Promise<string | null> {
  if (cachedBuildId && Date.now() - buildIdFetchedAt < BUILD_ID_TTL_MS) {
    return cachedBuildId
  }

  const response = await fetch("https://www.coles.com.au/", {
    signal: AbortSignal.timeout(10_000),
    headers: {
      ...BROWSER_HEADERS,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  })
  if (!response.ok) return null

  const html = await response.text()
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/)
  if (!match) return null

  cachedBuildId = match[1]
  buildIdFetchedAt = Date.now()
  return cachedBuildId
}

export async function scrapeColes(productName: string): Promise<ScrapedPrice | null> {
  const buildId = await getColesNextBuildId()
  if (!buildId) return null

  const url = `https://www.coles.com.au/_next/data/${buildId}/en/search/products.json?q=${encodeURIComponent(productName)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: BROWSER_HEADERS })
  if (!response.ok) return null

  const data = await response.json() as {
    pageProps?: {
      searchResults?: {
        results?: Array<{
          id?: string | number
          name?: string
          brand?: string
          pricing?: {
            now?: number
            promotionType?: string | null
            onlineSpecial?: boolean
            unit?: {
              price?: number
              ofMeasureQuantity?: number
              ofMeasureUnits?: string
            }
          }
        }>
      }
    }
  }

  const product = data.pageProps?.searchResults?.results?.[0]
  if (!product || product.pricing?.now == null) return null

  const unitPrice = product.pricing.unit?.price
  const price = (unitPrice != null && unitPrice > 0) ? unitPrice : product.pricing.now

  return {
    price,
    isSpecial: product.pricing.onlineSpecial === true,
    brand: product.brand ?? null,
    productUrl: product.id
      ? `https://www.coles.com.au/product/${product.id}`
      : null,
  }
}
