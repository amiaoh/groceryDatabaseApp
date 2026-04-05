import { z } from "zod"

// Enums
export const unitTypeSchema = z.enum(["kg", "L", "unit"])
export const priceSourceSchema = z.enum(["manual", "scraped"])

export type UnitType = z.infer<typeof unitTypeSchema>
export type PriceSource = z.infer<typeof priceSourceSchema>

// StoreChain
export const storeChainSchema = z.object({
  id: z.string(),
  name: z.string(),
  websiteUrl: z.string().nullable(),
})

export const createStoreChainSchema = storeChainSchema.omit({ id: true })

export type StoreChain = z.infer<typeof storeChainSchema>
export type CreateStoreChain = z.infer<typeof createStoreChainSchema>

// StoreLocation
export const storeLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  chainId: z.string().nullable(),
  suburb: z.string(),
  state: z.string().nullable(),
  address: z.string().nullable(),
})

export const createStoreLocationSchema = storeLocationSchema.omit({ id: true })

export const storeLocationWithChainSchema = storeLocationSchema.extend({
  chain: storeChainSchema.nullable(),
})

export type StoreLocation = z.infer<typeof storeLocationSchema>
export type CreateStoreLocation = z.infer<typeof createStoreLocationSchema>
export type StoreLocationWithChain = z.infer<typeof storeLocationWithChainSchema>

// Product
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  unitType: unitTypeSchema,
  category: z.string().nullable(),
})

export const createProductSchema = productSchema.omit({ id: true })

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>

// PriceRecord
export const priceRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  storeLocationId: z.string(),
  price: z.number().positive(),
  isSpecial: z.boolean(),
  validUntil: z.string().nullable(),
  source: priceSourceSchema,
  recordedAt: z.string(),
  productUrl: z.string().nullable(),
  userId: z.string().nullable(),
})

export const createPriceRecordSchema = priceRecordSchema.omit({
  id: true,
  recordedAt: true,
  userId: true,
})

export const priceRecordWithDetailsSchema = priceRecordSchema.extend({
  product: productSchema,
  storeLocation: storeLocationWithChainSchema,
})

export type PriceRecord = z.infer<typeof priceRecordSchema>
export type CreatePriceRecord = z.infer<typeof createPriceRecordSchema>
export type PriceRecordWithDetails = z.infer<typeof priceRecordWithDetailsSchema>

// Search result — cheapest stores for a product
export const cheapestStoreSchema = z.object({
  storeLocation: storeLocationWithChainSchema,
  price: z.number(),
  isSpecial: z.boolean(),
  recordedAt: z.string(),
})

export type CheapestStore = z.infer<typeof cheapestStoreSchema>
