import {
  pgTable,
  pgEnum,
  text,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"

// Enums
export const unitTypeEnum = pgEnum("unit_type", [
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

export const categoryEnum = pgEnum("category", [
  "Fruit & Vegetables",
  "Dairy",
  "Meat",
  "Frozen",
  "Pantry",
  "Household",
  "Health & Beauty",
  "Other",
])

export const priceSourceEnum = pgEnum("price_source", ["manual", "scraped"])

// Better Auth tables
export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const authSessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
})

export const authAccounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const authVerifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
})

// App tables
export const storeChains = pgTable("store_chain", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  websiteUrl: text("website_url"),
})

export const storeLocations = pgTable("store_location", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  chainId: text("chain_id").references(() => storeChains.id),
  suburb: text("suburb").notNull(),
  state: text("state"),
  address: text("address"),
})

export const products = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  unitType: unitTypeEnum("unit_type").notNull(),
  category: categoryEnum("category"),
  packageDetail: text("package_detail"),
})

export const priceRecords = pgTable("price_record", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  storeLocationId: text("store_location_id")
    .notNull()
    .references(() => storeLocations.id),
  brand: text("brand"),
  price: doublePrecision("price").notNull(),
  isSpecial: boolean("is_special").notNull().default(false),
  source: priceSourceEnum("source").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  productUrl: text("product_url"),
  userId: text("user_id").references(() => authUsers.id),
})

