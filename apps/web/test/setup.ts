import { transformSync } from "@babel/core"
import { plugin } from "bun"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../../..")

plugin({
  name: "stylex-tests",
  setup(build) {
    build.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
      const source = await Bun.file(path).text()
      const loader = path.endsWith(".tsx") ? "tsx" : "ts"

      if (
        path.includes("/node_modules/") ||
        !source.includes("@stylexjs/stylex")
      )
        return { contents: source, loader }

      const result = transformSync(source, {
        filename: path,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: [
          [
            Bun.resolveSync("@stylexjs/babel-plugin", import.meta.dirname),
            {
              aliases: {
                "ui/*": [resolve(root, "packages/ui/src/*")],
                "web/*": [resolve(root, "apps/web/src/*")],
              },
              dev: import.meta.env.NODE_ENV !== "production",
              runtimeInjection: false,
              treeshakeCompensation: true,
              // Match the Bun-compatible media handling used by Vite.
              enableMediaQueryOrder: false,
              unstable_moduleResolution: { rootDir: root, type: "commonJS" },
            },
          ],
        ],
      })

      if (!result?.code) throw new Error("StyleX compilation produced no code")

      return { contents: result.code, loader }
    })
  },
})
