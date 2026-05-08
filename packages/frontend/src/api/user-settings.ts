import type { UserDefaultStoreTarget } from "@grocery/shared"
import { apiFetch } from "./client"

export function getDefaultStores(): Promise<UserDefaultStoreTarget[]> {
  return apiFetch("/api/user-settings/default-stores")
}

export function updateDefaultStore(
  chainId: string,
  storeLocationId: string | null,
): Promise<UserDefaultStoreTarget[]> {
  return apiFetch("/api/user-settings/default-stores", {
    method: "PUT",
    body: JSON.stringify({ chainId, storeLocationId }),
  })
}
