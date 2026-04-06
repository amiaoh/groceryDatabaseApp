import { StoreLocationWithChain, CreateStoreLocation } from "@grocery/shared"
import { apiFetch } from "./client"

export function getStoreLocations(): Promise<StoreLocationWithChain[]> {
  return apiFetch("/api/store-locations")
}

export function createStoreLocation(
  data: CreateStoreLocation
): Promise<StoreLocationWithChain> {
  return apiFetch("/api/store-locations", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateStoreLocation(
  id: string,
  data: Partial<CreateStoreLocation>
): Promise<StoreLocationWithChain> {
  return apiFetch(`/api/store-locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function deleteStoreLocation(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/store-locations/${id}`, { method: "DELETE" })
}
