import { LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { login } from "@/lib/auth/login"

const LoginButton = () => {
  return (
    <form action={login}>
      <Button>
        <LogInIcon className="mr-2 h-4 w-4" />
        Login with Google
      </Button>
    </form>
  )
}

export default LoginButton
