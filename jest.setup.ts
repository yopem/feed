import "@testing-library/jest-dom"

import { TextDecoder, TextEncoder } from "util"
import { config } from "dotenv"

config({ path: ".env.test" })

jest.mock("server-only", () => ({}))

jest.mock("@/lib/db", () => ({
  db: null,
}))

jest.mock("@/lib/auth/session", () => ({
  auth: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}))

jest.mock("@/lib/db/redis", () => ({
  createRedisCache: jest.fn(),
}))

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

beforeAll(() => {
  process.env.TZ = "UTC"
})

afterEach(() => {
  jest.clearAllMocks()
})

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: jest.fn(),
}))

// Only define window.matchMedia in jsdom environment
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
