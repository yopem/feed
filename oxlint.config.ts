import baseConfig from "@yopem/oxlint-config"
import reactConfig from "@yopem/oxlint-config/react"
import { defineConfig } from "oxlint"

export default defineConfig({
  extends: [baseConfig, reactConfig],
  plugins: [
    "eslint",
    "import",
    "jsx-a11y",
    "oxc",
    "promise",
    "react",
    "react-perf",
    "typescript",
    "unicorn",
  ],
  jsPlugins: [
    {
      name: "yopem-ui",
      specifier: "@yopem-ui/oxlint-plugin",
    },
  ],
  overrides: [
    {
      files: ["apps/web/src/**/*.{tsx,jsx}"],
      rules: {
        "yopem-ui/enforce-styling-methods": [
          "error",
          {
            methods: {
              className: false,
              css: false,
              reactStyle: false,
              stylexStyle: true,
              xstyle: true,
            },
          },
        ],
        "yopem-ui/no-raw-stylex-colors": "error",
        "yopem-ui/static-stylex": "error",
        "yopem-ui/valid-polymorphic-as": "error",
      },
    },
  ],
  ignorePatterns: ["**/bun.lock", "**/AGENTS.md"],
})
