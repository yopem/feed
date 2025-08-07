import { HydrateClient } from "@/lib/trpc/server"

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-4xl">Coming soon ...</h1>
      </div>
    </HydrateClient>
  )
}
