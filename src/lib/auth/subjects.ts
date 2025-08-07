import { createSubjects } from "@openauthjs/openauth/subject"
import z from "zod"

export const subjects = createSubjects({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    username: z.string(),
    image: z.string().nullable(),
    role: z.enum(["user", "member", "admin"]).default("user"),
  }),
})
