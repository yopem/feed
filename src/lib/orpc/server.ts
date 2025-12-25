import { cookies } from "next/headers"

import { createORPCClientFromLink, createORPCLink } from "./shared"

const createServerFetchWithCookies = () => {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const fetchInit = { ...init }

    try {
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.toString()

      if (cookieHeader) {
        fetchInit.headers = {
          ...fetchInit.headers,
          cookie: cookieHeader,
        }
      }
    } catch (error) {
      console.error("Could not access cookies in server context:", error)
    }

    return fetch(input, {
      ...fetchInit,
      credentials: "include",
    })
  }
}

export const serverApi = createORPCClientFromLink(
  createORPCLink(createServerFetchWithCookies()),
)
