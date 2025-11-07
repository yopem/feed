/**
 * Mock for @t3-oss/env-nextjs
 *
 * This mock bypasses env validation and directly returns process.env values
 * for testing purposes. In test environment, we trust that .env.test has the
 * necessary values.
 */

module.exports = {
  createEnv: ({
    server = {},
    client = {},
    shared = {},
    experimental__runtimeEnv = {},
    skipValidation = false,
  }) => {
    // In tests, just return a proxy that reads from process.env
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          // First check if it's defined in experimental__runtimeEnv
          if (experimental__runtimeEnv && prop in experimental__runtimeEnv) {
            return experimental__runtimeEnv[prop]
          }
          // Otherwise return from process.env
          return process.env[prop]
        },
      },
    )
  },
}
