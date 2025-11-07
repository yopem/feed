import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return <DashboardClient username={session.username} />
}
