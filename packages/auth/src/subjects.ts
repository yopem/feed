import { createSubjects } from "@openauthjs/openauth/subject"
import { z } from "zod"

export const userSubjectSchema = z.object({
  id: z.string().min(1).max(512),
  email: z.email(),
  name: z.string().max(500).nullable(),
})

export const subjects = createSubjects({ user: userSubjectSchema })
