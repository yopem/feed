"use client"

import * as React from "react"
import NextLink, { type LinkProps as NextLinkProps } from "next/link"
import { useRouter } from "next/navigation"
import { ForesightManager, type ForesightRect } from "js.foresight"

interface LinkProps
  extends
    React.ComponentProps<typeof NextLink>,
    Omit<NextLinkProps, "prefetch"> {
  children: React.ReactNode
  className?: string
  hitSlop?: number | ForesightRect
  unregisterOnCallback?: boolean
  name?: string
}

const Link = (props: LinkProps) => {
  const {
    children,
    className,
    hitSlop = 0,
    unregisterOnCallback = true,
    name = "",
    ...rest
  } = props

  const [isTouchDevice, setIsTouchDevice] = React.useState(false)
  const LinkRef = React.useRef<HTMLAnchorElement>(null)

  const router = useRouter()

  React.useEffect(() => {
    if (!LinkRef.current) {
      return
    }

    const { unregister, isTouchDevice } = ForesightManager.instance.register({
      element: LinkRef.current,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      callback: () => router.prefetch(props.href.toString()),
      hitSlop,
      name,
      unregisterOnCallback,
    })

    setIsTouchDevice(isTouchDevice)

    return () => {
      unregister()
    }
  }, [LinkRef, router, props.href, hitSlop, name, unregisterOnCallback])

  return (
    <NextLink
      {...props}
      prefetch={isTouchDevice}
      ref={LinkRef}
      className={className}
      {...rest}
    >
      {children}
    </NextLink>
  )
}

export default Link
