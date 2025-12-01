"use client"

import { useEffect, useState } from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop
        setIsVisible(scrollY > 400)
      }, 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      scrollToTop()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      size="icon"
      className="fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg transition-opacity duration-200"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUpIcon className="h-5 w-5" />
    </Button>
  )
}
