import "server-only"

export async function lookupGeoLocation(ipAddress: string): Promise<{
  country: string | null
  city: string | null
}> {
  try {
    if (
      ipAddress === "127.0.0.1" ||
      ipAddress === "::1" ||
      ipAddress === "unknown" ||
      ipAddress.startsWith("192.168.") ||
      ipAddress.startsWith("10.") ||
      ipAddress.startsWith("172.")
    ) {
      return { country: null, city: null }
    }

    const apiUrl = "http://ip-api.com/json"

    const response = await fetch(`${apiUrl}/${ipAddress}`, {
      headers: {
        "User-Agent": "Yopem-Read/1.0",
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error(
        `[geolocation] API error: ${response.status} ${response.statusText}`,
      )
      return { country: null, city: null }
    }

    const data = await response.json()

    const country = data.countryCode ?? data.country ?? null
    const city = data.city ?? null

    return { country, city }
  } catch (error) {
    console.error("[geolocation] Lookup error:", error)
    return { country: null, city: null }
  }
}
