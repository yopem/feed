import { expect, test } from "bun:test"

import { configureTestEnvironment, testEnv } from "env/testing"

test("integration setup rejects non-test databases before changing environment", () => {
  const originalFlag = testEnv.RUN_DB_TESTS
  const originalUrl = testEnv.TEST_DATABASE_URL

  try {
    testEnv.RUN_DB_TESTS = true

    for (const url of [
      undefined,
      "postgres://localhost/feed",
      "postgres://remote.example/feed_test",
    ]) {
      testEnv.TEST_DATABASE_URL = url
      expect(configureTestEnvironment).toThrow()
    }
  } finally {
    testEnv.RUN_DB_TESTS = originalFlag
    testEnv.TEST_DATABASE_URL = originalUrl
  }
})
