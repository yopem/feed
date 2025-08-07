import baseConfig, { restrictEnvAccess } from "@yopem/eslint-config/base"
import nextjsConfig from "@yopem/eslint-config/nextjs"
import reactConfig from "@yopem/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-prototype-builtins": "off",
      "no-console": ["error", { allow: ["error", "warn", "info"] }],
    },
  },
]
