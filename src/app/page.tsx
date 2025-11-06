import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"

import LoginButton from "@/components/auth/login-button"
import LogoutButton from "@/components/auth/logout-button"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/session"

export default async function Home() {
  noStore()
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-4xl font-bold">Welcome to Feed Reader</h1>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <LogoutButton />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-accent-foreground text-lg">
            Sign in to start reading your feeds
          </p>
          <LoginButton />
        </div>
      )}
    </div>
  )
}
