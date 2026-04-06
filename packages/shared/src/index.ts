import { z } from "zod"

// Enums
export const unitTypeSchema = z.enum([
  "kg",
  "g",
  "L",
  "mL",
  "unit",
  "dozen",
  "packet",
  "can",
  "bottle",
])

export const categorySchema = z.enum([
  "Fruit & Vegetables",
  "Dairy",
  "Meat",
  "Frozen",
  "Pantry",
  "Household",
  "Health & Beauty",
  "Other",
])

export const priceSourceSchema = z.enum(["manual", "scraped"])

// Unit types where the user can optionally specify package size (e.g. "400g", "375mL")
export const UNITS_WITH_PACKAGE_DETAIL = new Set<UnitType>([
  "packet",
  "can",
  "bottle",
  "dozen",
])

export type UnitType = z.infer<typeof unitTypeSchema>
export type Category = z.infer<typeof categorySchema>
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
  category: categorySchema.nullable(),
  packageDetail: z.string().nullable(),
})

export const createProductSchema = productSchema.omit({ id: true })

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>

// PriceRecord
export const priceRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  storeLocationId: z.string(),
  brand: z.string().nullable(),
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

// Search result — cheapest deals for a product (one entry per store+brand combination)
export const cheapestStoreSchema = z.object({
  storeLocation: storeLocationWithChainSchema,
  brand: z.string().nullable(),
  price: z.number(),
  isSpecial: z.boolean(),
  recordedAt: z.string(),
})

export type CheapestStore = z.infer<typeof cheapestStoreSchema>
