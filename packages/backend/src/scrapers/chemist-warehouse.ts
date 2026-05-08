import type { ScrapedPrice } from "./types.ts"

const SEARCH_URL = "https://www.chemistwarehouse.com.au/search"

export async function scrapeChemistWarehouse(productName: string): Promise<ScrapedPrice | null> {
  const url = `${SEARCH_URL}?searchstring=${encodeURIComponent(productName)}&selectedCategory=all`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-AU,en;q=0.9",
    },
  })

  if (!response.ok) return null

  const html = await response.text()

  // Look for JSON-LD Product schema first (most reliable)
  const jsonLdMatches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of jsonLdMatches) {
    try {
      const json = JSON.parse(match[1])
      const items: Array<{ "@type"?: string; offers?: { price?: number | string }; url?: string; name?: string }> =
        json["@type"] === "ItemList" ? (json.itemListElement ?? []).map((e: { item?: unknown }) => e.item) :
        Array.isArray(json) ? json : [json]

      for (const item of items) {
        if (!item || item["@type"] !== "Product") continue
        const price = parseFloat(String(item.offers?.price ?? ""))
        if (!isNaN(price) && price > 0) {
          return {
            price,
            isSpecial: false,
            brand: null,
            productUrl: item.url ? String(item.url) : null,
          }
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  // Fallback: parse HTML for price patterns in product listing markup
  // CW uses class="Price" and links like /buy/product/NNN/category-slug
  const productBlockRe = /class="[^"]*product-detail[^"]*"[\s\S]{0,2000}?class="[^"]*Price[^"]*"[^>]*>\s*\$([\d]+\.[\d]{2})/i
  const blockMatch = html.match(productBlockRe)
    ?? html.match(/\$\s*([\d]+\.[\d]{2})/i)

  if (!blockMatch) return null

  const price = parseFloat(blockMatch[1])
  if (isNaN(price) || price <= 0) return null

  const linkMatch = html.match(/href="(\/buy\/[^"]+)"/)
  const productUrl = linkMatch ? `https://www.chemistwarehouse.com.au${linkMatch[1]}` : null

  const isSpecial = /was\s*\$|on sale|special/i.test(html.slice(0, html.indexOf(blockMatch[0]) + 500))

  return { price, isSpecial, brand: null, productUrl }
}
