"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"

export function SafeImage(props: ImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return null
  }

  return <Image {...props} onError={() => setHasError(true)} />
}
