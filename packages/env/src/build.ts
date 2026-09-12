import "zod/compile"
import { z } from "zod"

export const buildEnv = z
  .object({
    WEB_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  })
  .parse({ WEB_PORT: import.meta.env.WEB_PORT })
