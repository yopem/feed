import { createCustomId } from "@/lib/utils/custom-id"

describe("createCustomId", () => {
  it("generates a string of 64 characters", () => {
    const id = createCustomId()
    expect(id).toHaveLength(64)
  })

  it("only contains alphanumeric characters", () => {
    const id = createCustomId()
    expect(id).toMatch(/^[a-zA-Z0-9]+$/)
  })

  it("generates unique IDs", () => {
    const ids = new Set()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      ids.add(createCustomId())
    }

    expect(ids.size).toBe(iterations)
  })

  it("generates different IDs on each call", () => {
    const id1 = createCustomId()
    const id2 = createCustomId()
    const id3 = createCustomId()

    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })

  it("does not contain special characters or whitespace", () => {
    const id = createCustomId()

    expect(id).not.toContain(" ")
    expect(id).not.toContain("-")
    expect(id).not.toContain("_")
    expect(id).not.toContain(".")
    expect(id).not.toContain("/")
  })
})
