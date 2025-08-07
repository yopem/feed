import LoginButton from "@/components/auth/login-button"
import { getScopedI18n } from "@/lib/locales/server"

export default async function LoginPage() {
  const ts = await getScopedI18n("user")

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold">{ts("welcome_back")}</h1>
        </div>
        <p className="p-5 text-center">{ts("header")}</p>
        <div className="flex items-center justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
