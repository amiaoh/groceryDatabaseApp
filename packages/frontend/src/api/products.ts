import { Product, CreateProduct } from "@grocery/shared"
import { apiFetch } from "./client"

export function searchProducts(query: string): Promise<Product[]> {
  return apiFetch(`/api/products?search=${encodeURIComponent(query)}`)
}

export function createProduct(data: CreateProduct): Promise<Product> {
  return apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateProduct(id: string, data: Partial<CreateProduct>): Promise<Product> {
  return apiFetch(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
