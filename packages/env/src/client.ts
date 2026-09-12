import "zod/compile"
import { z } from "zod"

export const clientEnv = z
  .object({
    VITE_SERVER_URL: z.url().default("http://localhost:4000"),
  })
  .parse({ VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL })
