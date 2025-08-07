import { LogOutIcon as LogoutIcon } from "lucide-react"

import { logout } from "@/lib/auth/logout"

const LogoutButton = () => {
  return (
    <form action={logout}>
      <button
        aria-label="Keluar"
        className="inline-flex cursor-pointer flex-row"
      >
        <LogoutIcon name="LogOut" className="mr-2" />
        Keluar
      </button>
    </form>
  )
}

export default LogoutButton
