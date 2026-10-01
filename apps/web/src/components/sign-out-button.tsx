import * as stylex from "@stylexjs/stylex"
import { LogOutIcon } from "lucide-react"

import { useLogout } from "rpc/reader"
import { Button } from "ui/button"

const styles = stylex.create({
  iconButton: {
    width: 34,
    paddingInline: 0,
  },
  error: {
    minHeight: 24,
    marginBlock: 6,
    fontSize: 12,
  },
})

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const logout = useLogout()

  return (
    <div>
      <Button
        variant={compact ? "ghost" : "outline"}
        xstyle={compact ? styles.iconButton : undefined}
        disabled={logout.isPending}
        aria-label="Sign out"
        title="Sign out"
        onClick={() => logout.mutate()}
      >
        <LogOutIcon aria-hidden="true" />
        {compact ? null : logout.isPending ? "Signing out…" : "Sign out"}
      </Button>
      {logout.isError ? (
        <p {...stylex.props(styles.error)} role="alert">
          {logout.error.message}
        </p>
      ) : null}
    </div>
  )
}
