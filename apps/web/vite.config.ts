import type { InputOptions } from "@babel/core"
import type { AcceptedPlugin } from "postcss"

import babel from "@rolldown/plugin-babel"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { defineConfig } from "vite"

import { buildEnv } from "env/build"

interface StylexPostcssOptions {
  cwd: string
  include: string[]
  babelConfig: InputOptions
  useCSSLayers: boolean
}

const root = resolve(import.meta.dirname, "../..")

const stylexPlugins: [string, object][] = [
  [
    "@stylexjs/babel-plugin",
    {
      aliases: {
        "ui/*": [resolve(root, "packages/ui/src/*")],
        "web/*": [resolve(root, "apps/web/src/*")],
      },
      dev: import.meta.env.NODE_ENV !== "production",
      runtimeInjection: false,
      treeshakeCompensation: true,
      // StyleX's media-order parser fails on repeated transforms under Bun.
      enableMediaQueryOrder: false,
      unstable_moduleResolution: { rootDir: root, type: "commonJS" },
    },
  ],
]

const loadStylexPostcss: (options: StylexPostcssOptions) => AcceptedPlugin =
  createRequire(import.meta.url)("@stylexjs/postcss-plugin")

export default defineConfig({
  envDir: "../..",
  server: { port: buildEnv.WEB_PORT, strictPort: true },
  build: { cssCodeSplit: false },
  css: {
    postcss: {
      plugins: [
        loadStylexPostcss({
          cwd: import.meta.dirname,
          include: [
            "src/**/*.{js,jsx,ts,tsx}",
            "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
          ],
          babelConfig: {
            babelrc: false,
            parserOpts: { plugins: ["typescript", "jsx"] },
            plugins: stylexPlugins,
          },
          useCSSLayers: false,
        }),
      ],
    },
  },
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  ssr: { noExternal: ["@base-ui/react", "@base-ui/utils", "ui"] },
  plugins: [babel({ plugins: stylexPlugins }), tanstackStart(), viteReact()],
})
