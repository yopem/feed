import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
