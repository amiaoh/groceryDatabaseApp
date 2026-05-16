import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db/index.ts"
import * as schema from "./db/schema.ts"

export const auth = betterAuth({
  baseURL: (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  trustedOrigins: [
    process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:5173",
    "http://localhost:5173",
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
