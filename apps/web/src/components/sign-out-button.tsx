import { LogOutIcon } from "lucide-react"

import { useLogout } from "rpc/reader"
import { Button } from "ui/button"

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const logout = useLogout()
  return (
    <div>
      <Button
        variant={compact ? "ghost" : "outline"}
        className={compact ? "icon-button" : ""}
        disabled={logout.isPending}
        aria-label="Sign out"
        title="Sign out"
        onClick={() => logout.mutate()}
      >
        <LogOutIcon aria-hidden="true" />
        {compact ? null : logout.isPending ? "Signing out…" : "Sign out"}
      </Button>
      {logout.isError ? (
        <p className="field-error" role="alert">
          {logout.error.message}
        </p>
      ) : null}
    </div>
  )
}
