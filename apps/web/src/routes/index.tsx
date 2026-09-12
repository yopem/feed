import { createFileRoute } from "@tanstack/react-router"
import { Reader } from "web/features/reader/reader"

export const Route = createFileRoute("/")({
  ssr: false,
  component: Reader,
})
