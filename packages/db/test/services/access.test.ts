import { expect, test } from "bun:test"

import { assertRole } from "db/services/access"

test("workspace membership gates reads and editor/owner gates writes", () => {
  expect(() => assertRole(undefined)).toThrow("Workspace access denied")
  expect(() => assertRole("viewer", true)).toThrow("Workspace access denied")

  for (const role of ["owner", "editor", "viewer"] as const)
    expect(() => assertRole(role)).not.toThrow()

  for (const role of ["owner", "editor"] as const)
    expect(() => assertRole(role, true)).not.toThrow()
})
