import "zod/compile"
import { defineConfig } from "drizzle-kit"

import { env } from "env/server"

export default defineConfig({
  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/schema/*.ts",
  out: "./src/migrations",
  dbCredentials: { url: env.DATABASE_URL },
})
