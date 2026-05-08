import type { ScrapedPrice } from "./types.ts"

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-AU,en;q=0.9",
}

export async function scrapeAldi(productName: string): Promise<ScrapedPrice | null> {
  if (process.env.ALDI_SCRAPER_DISABLED === "true") return null

  const url = `https://www.aldi.com.au/results?q=${encodeURIComponent(productName)}`
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: BROWSER_HEADERS,
  })
  if (!response.ok) return null

  const html = await response.text()

  // The /results page is SSR-rendered by Nuxt — product tiles are in the initial HTML.
  // Tiles are separated by their unique id="product-tile-..." div.
  const tileParts = html.split(/(?=<div id="product-tile-)/)

  const searchLower = productName.toLowerCase()
  // True when the user explicitly asked for bone-in product (e.g. "chicken cutlet")
  const searchWantsBoneIn = /bone[- ]?in|cutlet/.test(searchLower)
  // Attribute qualifiers don't appear literally in product titles — exclude them from
  // required-keyword matching (boneless is already handled by the bone-in exclusion above).
  const ATTRIBUTE_QUALIFIERS = new Set(["boneless", "skinless", "fresh", "frozen"])
  const searchKeywords = searchLower.split(/\s+/).filter((w) => w && !ATTRIBUTE_QUALIFIERS.has(w))

  const candidates: Array<{ price: number; isSpecial: boolean; productUrl: string | null }> = []

  for (const part of tileParts) {
    if (!part.startsWith('<div id="product-tile-')) continue

    // Title is on the inner .product-tile div
    const titleMatch = part.match(/class="product-tile"[^>]*title="([^"]+)"/)
    const title = titleMatch?.[1]?.toLowerCase() ?? ""

    // All search keywords must appear in the title to avoid wrong-cut matches
    // (e.g. "breast" when searching "thigh"). Strip trailing 's' so "fillets"
    // matches "fillet" and vice-versa.
    const allMatch = searchKeywords.every((kw) => {
      const stem = kw.length > 3 ? kw.replace(/s$/, "") : kw
      return title.includes(kw) || title.includes(stem)
    })
    if (!allMatch) continue

    // Exclude bone-in products (cutlets) unless the search explicitly asked for them.
    // In AU supermarkets "cutlet" and "bone in" both mean the thigh has a bone attached.
    if (!searchWantsBoneIn && /bone[- ]?in|cutlet/i.test(title)) continue

    // Prefer the comparison/unit price (e.g. "$13.29 per 1 kg")
    const unitPriceMatch = part.match(/product-tile__comparison-price[^<]*<p[^>]*>\(\$([0-9]+(?:\.[0-9]+)?) per/)
    // Fall back to the displayed package price
    const basePriceMatch = part.match(/base-price__regular[^<]*<span[^>]*>\$([0-9]+(?:\.[0-9]+)?)/)

    const priceStr = unitPriceMatch?.[1] ?? basePriceMatch?.[1]
    if (!priceStr) continue

    const price = parseFloat(priceStr)
    if (isNaN(price) || price <= 0) continue

    const hrefMatch = part.match(/href="(\/product\/[^"]+)"/)
    const productUrl = hrefMatch ? `https://www.aldi.com.au${hrefMatch[1]}` : null
    const isSpecial = /special|sale|offer/i.test(part)

    candidates.push({ price, isSpecial, productUrl })
  }

  if (candidates.length === 0) return null

  const cheapest = candidates.reduce((min, c) => c.price < min.price ? c : min)

  return {
    price: cheapest.price,
    isSpecial: cheapest.isSpecial,
    brand: null,
    productUrl: cheapest.productUrl,
  }
}
