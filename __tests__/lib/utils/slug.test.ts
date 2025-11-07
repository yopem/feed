import { slugify, slugifyFile, slugifyUsername } from "@/lib/utils/slug"

describe("slugify", () => {
  it("converts text to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("handles special characters and accents", () => {
    expect(slugify("Café Restaurant")).toBe("cafe-restaurant")
    expect(slugify("São Paulo")).toBe("sao-paulo")
    expect(slugify("Zürich")).toBe("zurich")
  })

  it("removes non-word characters", () => {
    expect(slugify("Hello & World!")).toBe("hello-world")
    expect(slugify("Test @ 2024")).toBe("test-2024")
    expect(slugify("Price: $99.99")).toBe("price-9999")
  })

  it("replaces multiple spaces with single dash", () => {
    expect(slugify("Hello   World")).toBe("hello-world")
    expect(slugify("Too     Many     Spaces")).toBe("too-many-spaces")
  })

  it("replaces underscores with dashes", () => {
    expect(slugify("hello_world")).toBe("hello-world")
    expect(slugify("test_file_name")).toBe("test-file-name")
  })

  it("removes leading and trailing whitespace", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world")
    expect(slugify("\tTest\t")).toBe("test")
  })

  it("removes trailing dashes", () => {
    expect(slugify("Hello World-")).toBe("hello-world")
    expect(slugify("Test---")).toBe("test")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles already slugified text", () => {
    expect(slugify("hello-world")).toBe("hello-world")
    expect(slugify("test-123")).toBe("test-123")
  })

  it("handles non-Latin characters", () => {
    expect(slugify("Привет мир")).toBe("privet-mir")
    expect(slugify("你好世界")).toBe("ni-hao-shi-jie")
    expect(slugify("こんにちは")).toBe("konnitiha")
  })

  it("handles numbers", () => {
    expect(slugify("Test 123")).toBe("test-123")
    expect(slugify("2024 Goals")).toBe("2024-goals")
  })
})

describe("slugifyUsername", () => {
  it("removes all spaces and dashes", () => {
    expect(slugifyUsername("John Doe")).toBe("johndoe")
    expect(slugifyUsername("john-doe")).toBe("johndoe")
  })

  it("converts to lowercase", () => {
    expect(slugifyUsername("JohnDoe")).toBe("johndoe")
    expect(slugifyUsername("TESTUSER")).toBe("testuser")
  })

  it("handles special characters and accents", () => {
    expect(slugifyUsername("José García")).toBe("josegarcia")
    expect(slugifyUsername("François")).toBe("francois")
  })

  it("removes non-word characters", () => {
    expect(slugifyUsername("john@doe.com")).toBe("johndoecom")
    expect(slugifyUsername("user_123")).toBe("user123")
  })

  it("removes underscores", () => {
    expect(slugifyUsername("john_doe_123")).toBe("johndoe123")
  })

  it("handles empty string", () => {
    expect(slugifyUsername("")).toBe("")
  })

  it("keeps alphanumeric characters together", () => {
    expect(slugifyUsername("user123")).toBe("user123")
    expect(slugifyUsername("test2024")).toBe("test2024")
  })
})

describe("slugifyFile", () => {
  it("preserves dots for file extensions", () => {
    expect(slugifyFile("my file.txt")).toBe("my-file.txt")
    expect(slugifyFile("document.pdf")).toBe("document.pdf")
  })

  it("converts to lowercase kebab-case", () => {
    expect(slugifyFile("My Document.pdf")).toBe("my-document.pdf")
  })

  it("handles multiple dots", () => {
    expect(slugifyFile("archive.tar.gz")).toBe("archive.tar.gz")
    expect(slugifyFile("file.backup.txt")).toBe("file.backup.txt")
  })

  it("handles special characters", () => {
    expect(slugifyFile("My File (Copy).txt")).toBe("my-file-copy.txt")
    expect(slugifyFile("Document #1.pdf")).toBe("document-1.pdf")
  })

  it("replaces spaces with dashes", () => {
    expect(slugifyFile("my file name.txt")).toBe("my-file-name.txt")
  })

  it("replaces underscores with dashes", () => {
    expect(slugifyFile("my_file_name.txt")).toBe("my-file-name.txt")
  })

  it("removes trailing dashes from filename part", () => {
    expect(slugifyFile("file.txt")).toBe("file.txt")
    expect(slugifyFile("my-file.txt")).toBe("my-file.txt")
  })

  it("handles empty string", () => {
    expect(slugifyFile("")).toBe("")
  })

  it("handles file without extension", () => {
    expect(slugifyFile("README")).toBe("readme")
    expect(slugifyFile("My Document")).toBe("my-document")
  })
})
