import LoginButton from "@/components/auth/login-button"

export default function LoginPage() {
  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
        </div>
        <p className="p-5 text-center">Use your google account to continue</p>
        <div className="flex items-center justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
