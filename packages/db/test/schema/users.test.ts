import { expect, test } from "bun:test"

import { insertUserSchema, updateUserSchema, userSchema } from "db/schema/users"

test("table-derived schemas validate insert, select and partial updates", () => {
  const user = {
    id: crypto.randomUUID(),
    issuer: "https://auth.yopem.com",
    subjectId: "external-user-123",
    email: "reader@example.com",
    name: "Reader",
  }

  expect(insertUserSchema.parse(user)).toEqual(user)
  expect(userSchema.parse(user)).toEqual(user)
  expect(updateUserSchema.parse({ name: "New name" })).toEqual({
    name: "New name",
  })
  expect(insertUserSchema.safeParse({ name: "Missing fields" }).success).toBe(
    false,
  )
})
