import * as React from "react"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
