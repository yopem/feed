export default {
  plugins: ["eslint", "import", "oxc", "promise", "typescript", "unicorn"],
  categories: {
    correctness: "error",
  },
  env: {
    builtin: true,
  },
  settings: {
    tailwindcss: {
      entryPoint: [
        {
          files: "**",
          use: "./packages/ui/src/style.css",
        },
      ],
    },
  },
  rules: {
    "import/no-relative-parent-imports": "error",
    "no-array-constructor": "error",
    "no-async-promise-executor": "error",
    "no-case-declarations": "error",
    "no-compare-neg-zero": "error",
    "no-cond-assign": "error",
    "no-console": [
      "error",
      {
        allow: ["error", "warn", "info"],
      },
    ],
    "no-constant-binary-expression": "error",
    "no-constant-condition": "error",
    "no-control-regex": "error",
    "no-debugger": "error",
    "no-delete-var": "error",
    "no-dupe-else-if": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-empty-character-class": "error",
    "no-empty-function": "error",
    "no-empty-pattern": "error",
    "no-empty-static-block": "error",
    "no-ex-assign": "error",
    "no-extra-boolean-cast": "error",
    "no-fallthrough": "error",
    "no-global-assign": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-loss-of-precision": "error",
    "no-misleading-character-class": "error",
    "no-nonoctal-decimal-escape": "error",
    "no-regex-spaces": "error",
    "no-self-assign": "error",
    "no-shadow-restricted-names": "error",
    "no-sparse-arrays": "error",
    "no-unexpected-multiline": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-optional-chaining": "error",
    "no-unused-expressions": "error",
    "no-unused-labels": "error",
    "no-unused-private-class-members": "error",
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "no-useless-backreference": "error",
    "no-useless-catch": "error",
    "no-useless-escape": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "require-await": "error",
    "require-yield": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
    "typescript/adjacent-overload-signatures": "error",
    "typescript/array-type": "error",
    "typescript/await-thenable": "error",
    "typescript/ban-tslint-comment": "error",
    "typescript/consistent-generic-constructors": "error",
    "typescript/consistent-indexed-object-style": "error",
    "typescript/consistent-type-definitions": "error",
    "typescript/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      },
    ],
    "typescript/no-array-delete": "error",
    "typescript/no-base-to-string": "error",
    "typescript/no-confusing-non-null-assertion": "error",
    "typescript/no-duplicate-enum-values": "error",
    "typescript/no-duplicate-type-constituents": "error",
    "typescript/no-empty-object-type": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-extra-non-null-assertion": "error",
    "typescript/no-for-in-array": "error",
    "typescript/no-implied-eval": "error",
    "typescript/no-inferrable-types": "error",
    "typescript/no-misused-new": "error",
    "typescript/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "typescript/no-namespace": "error",
    "typescript/no-non-null-asserted-optional-chain": "error",
    "typescript/no-redundant-type-constituents": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-this-alias": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-unsafe-declaration-merging": "error",
    "typescript/no-unsafe-enum-comparison": "error",
    "typescript/no-unsafe-function-type": "error",
    "typescript/no-unsafe-unary-minus": "error",
    "typescript/no-wrapper-object-types": "error",
    "typescript/non-nullable-type-assertion-style": "error",
    "typescript/prefer-as-const": "error",
    "typescript/prefer-for-of": "error",
    "typescript/prefer-function-type": "error",
    "typescript/prefer-includes": "error",
    "typescript/prefer-namespace-keyword": "error",
    "typescript/prefer-nullish-coalescing": "error",
    "typescript/prefer-optional-chain": "error",
    "typescript/prefer-promise-reject-errors": "error",
    "typescript/require-await": "error",
    "typescript/restrict-plus-operands": "error",
    "typescript/triple-slash-reference": "error",
  },
  ignorePatterns: [
    "**/bun.lock",
    "**/migrations/**",
    "**/AGENTS.md",
    "**/routeTree.gen.ts",
    "**/dist/**",
    "**/.tanstack/**",
    "docs/**",
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: ["apps/**", "packages/{auth,cache,env,rpc,ui,utils}/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["drizzle-orm", "drizzle-orm/*"],
                message: "Database access belongs in packages/db services.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["apps/web/**", "packages/ui/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [
                  "drizzle-orm",
                  "drizzle-orm/*",
                  "db",
                  "db/*",
                  "/server",
                  "/server/*",
                  "@hono/zod-openapi",
                ],
                message:
                  "Use packages/rpc; database and server modules are server-only.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["packages/{auth,cache,env,rpc,utils}/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@hono/zod-openapi"],
                message: "OpenAPI belongs in apps/server routes.",
              },
              {
                group: ["drizzle-orm", "drizzle-orm/*"],
                message: "Database access belongs in packages/db services.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["packages/db/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@hono/zod-openapi"],
                message: "OpenAPI belongs in apps/server routes.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["apps/web/**", "packages/ui/**"],
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
      jsPlugins: ["oxlint-tailwindcss", "eslint-plugin-react-compiler"],
      rules: {
        "react-compiler/react-compiler": "error",
        "react/rules-of-hooks": "error",
        "tailwindcss/enforce-canonical": "error",
        "tailwindcss/enforce-consistent-important-position": "error",
        "tailwindcss/enforce-negative-arbitrary-values": "error",
        "tailwindcss/enforce-shorthand": "error",
        "tailwindcss/enforce-sort-order": "off",
        "tailwindcss/no-conflicting-classes": "error",
        "tailwindcss/no-deprecated-classes": "error",
        "tailwindcss/no-unknown-classes": [
          "error",
          {
            allowlist: ["reader-shell", "reader-sidebar", "article-body"],
          },
        ],
        "tailwindcss/no-unnecessary-arbitrary-value": "error",
        "tailwindcss/no-unnecessary-whitespace": "error",
      },
    },
  ],
}
