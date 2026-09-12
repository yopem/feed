import { and, eq } from "drizzle-orm"

import { db } from "db/index"
import { users } from "db/schema/users"
import { ServiceError } from "db/services/access"
import { createId } from "utils/id"

export async function findUser(issuer: string, subjectId: string) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.issuer, issuer), eq(users.subjectId, subjectId)))
  return user ?? null
}

export async function provisionUser(
  issuer: string,
  profile: { id: string; email: string; name: string | null },
  signupEnabled: boolean,
) {
  const identity = and(
    eq(users.issuer, issuer),
    eq(users.subjectId, profile.id),
  )
  const [existing] = await db.select().from(users).where(identity)
  const details = { email: profile.email, name: profile.name ?? profile.email }
  if (existing) {
    const [updated] = await db
      .update(users)
      .set(details)
      .where(identity)
      .returning()
    if (!updated) throw new Error("User update failed")
    return updated
  }
  if (!signupEnabled) throw new ServiceError("Signup is disabled")
  const [created] = await db
    .insert(users)
    .values({ id: createId(), issuer, subjectId: profile.id, ...details })
    .onConflictDoUpdate({
      target: [users.issuer, users.subjectId],
      set: details,
    })
    .returning()
  if (!created) throw new Error("User creation failed")
  return created
}
