import { expect, test } from "bun:test"

import { userSubjectSchema } from "auth/subjects"

test("Yopem subject accepts string IDs and nullable names without granting roles", () => {
  expect(
    userSubjectSchema.parse({
      id: "user_from_shared_issuer",
      email: "reader@example.com",
      name: null,
      username: "reader",
      image: null,
      role: "admin",
    }),
  ).toEqual({
    id: "user_from_shared_issuer",
    email: "reader@example.com",
    name: null,
  })
  expect(
    userSubjectSchema.safeParse({ id: "", email: "bad", name: null }).success,
  ).toBe(false)
})
