import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth/logout"

const LogoutButton = () => {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label="Logout"
        className="gap-2"
      >
        <LogOutIcon className="size-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </form>
  )
}

export default LogoutButton
