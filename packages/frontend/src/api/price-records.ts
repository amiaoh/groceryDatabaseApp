import { CheapestStoresResponse, CreatePriceRecord, PriceRecord } from "@grocery/shared"
import { apiFetch } from "./client"

export function getCheapestStores(productId: string, force = false, noScrape = false): Promise<CheapestStoresResponse> {
  const params = new URLSearchParams({ productId })
  if (force) params.set("force", "true")
  if (noScrape) params.set("noScrape", "true")
  return apiFetch(`/api/price-records/cheapest?${params}`)
}

export function getBrands(): Promise<string[]> {
  return apiFetch("/api/price-records/brands")
}

export function createPriceRecord(data: CreatePriceRecord): Promise<PriceRecord> {
  return apiFetch("/api/price-records", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
