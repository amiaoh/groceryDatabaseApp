import type { ScrapedPrice } from "./types.ts"

const INTERNAL_API_URL = "https://www.woolworths.com.au/apis/ui/Search/products"

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-AU,en;q=0.9",
}

// Woolworths API requires Akamai bot-protection cookies from a prior page load.
// Cache them with a short TTL to avoid a homepage fetch on every search.
let cachedCookies: string | null = null
let cookiesFetchedAt = 0
const COOKIES_TTL_MS = 4 * 60 * 1000 // 4 minutes (Akamai tokens expire quickly)

async function getWoolworthsCookies(): Promise<string> {
  if (cachedCookies && Date.now() - cookiesFetchedAt < COOKIES_TTL_MS) {
    return cachedCookies
  }

  const response = await fetch("https://www.woolworths.com.au/", {
    signal: AbortSignal.timeout(12_000),
    headers: {
      ...BROWSER_HEADERS,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  })

  // Node 18+ Headers.getSetCookie() returns all Set-Cookie values as an array
  const setCookies = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  cachedCookies = setCookies.map((c) => c.split(";")[0]).join("; ")
  cookiesFetchedAt = Date.now()
  return cachedCookies
}

export async function scrapeWoolworths(productName: string): Promise<ScrapedPrice | null> {
  const cookieString = await getWoolworthsCookies()

  const response = await fetch(INTERNAL_API_URL, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Cookie": cookieString,
      "Origin": "https://www.woolworths.com.au",
      "Referer": `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(productName)}`,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({
      Filters: [],
      IsSpecial: false,
      Location: `/shop/search/products?searchTerm=${encodeURIComponent(productName)}`,
      PageNumber: 1,
      PageSize: 10,
      SearchTerm: productName,
      SortType: "CUPAsc",
    }),
  })
  if (!response.ok) return null

  const data = await response.json() as {
    Products?: Array<{ Products?: Array<{
      Price?: number; IsOnSpecial?: boolean; Brand?: string
      Stockcode?: number; UrlFriendlyName?: string
      CupPrice?: number; CupMeasure?: string; Name?: string
    }> }>
  }

  // Flatten all result products (API returns groups of 1); already sorted by CUP price asc.
  const allProducts = data.Products?.flatMap((p) => p.Products ?? []) ?? []

  const searchWantsBoneIn = /bone[- ]?in|cutlet/.test(productName.toLowerCase())
  const candidates = allProducts.filter((p) => {
    if (p.Price == null) return false
    const name = (p.Name ?? "").toLowerCase()
    // Exclude bone-in products (cutlets) unless explicitly searched for.
    if (!searchWantsBoneIn && /bone[- ]?in|cutlet/.test(name)) return false
    return true
  })

  const product = candidates[0]
  if (!product || product.Price == null) return null

  const price = (product.CupPrice != null && product.CupPrice > 0) ? product.CupPrice : product.Price

  return {
    price,
    isSpecial: product.IsOnSpecial ?? false,
    brand: product.Brand ?? null,
    productUrl: product.Stockcode && product.UrlFriendlyName
      ? `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}/${product.UrlFriendlyName}`
      : null,
  }
}
