import { CheapestStore, CreatePriceRecord, PriceRecord } from "@grocery/shared"
import { apiFetch } from "./client"

export function getCheapestStores(productId: string): Promise<CheapestStore[]> {
  return apiFetch(`/api/price-records/cheapest?productId=${productId}`)
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
