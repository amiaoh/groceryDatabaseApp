import { StoreChain, CreateStoreChain } from "@grocery/shared"
import { apiFetch } from "./client"

export function getStoreChains(): Promise<StoreChain[]> {
  return apiFetch("/api/store-chains")
}

export function createStoreChain(data: CreateStoreChain): Promise<StoreChain> {
  return apiFetch("/api/store-chains", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateStoreChain(
  id: string,
  data: Partial<CreateStoreChain>
): Promise<StoreChain> {
  return apiFetch(`/api/store-chains/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
