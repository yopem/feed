import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { buildEnv } from "env/build"

export default defineConfig({
  envDir: "../..",
  server: { port: buildEnv.WEB_PORT, strictPort: true },
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
})
