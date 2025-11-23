"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  MenuIcon,
  PaletteIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Settings sidebar navigation component
 *
 * Provides navigation between settings categories with mobile-responsive behavior.
 * Uses URL state management via nuqs for persistent category selection.
 */

interface SettingsSidebarProps {
  className?: string
}

interface NavItem {
  id: string
  label: string
  icon: typeof RefreshCwIcon
  ariaLabel: string
}

const navItems: NavItem[] = [
  {
    id: "feed",
    label: "Feed Management",
    icon: RefreshCwIcon,
    ariaLabel: "Navigate to Feed Management settings",
  },
  {
    id: "article",
    label: "Article Management",
    icon: TrashIcon,
    ariaLabel: "Navigate to Article Management settings",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: PaletteIcon,
    ariaLabel: "Navigate to Appearance settings",
  },
]

function SidebarContent({
  section,
  onSectionChange,
  onMobileClose,
}: {
  section: string
  onSectionChange: (section: string) => void
  onMobileClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-3 border-b px-4 py-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back to Home</span>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label="Settings navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = section === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onSectionChange(item.id)
                    onMobileClose?.()
                  }}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export function SettingsSidebar({ className }: SettingsSidebarProps) {
  const [section, setSection] = useQueryState(
    "section",
    parseAsString.withDefault("feed"),
  )
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <aside
        className={cn(
          "bg-background border-border hidden h-full w-64 shrink-0 border-r md:block",
          className,
        )}
      >
        <SidebarContent
          section={section}
          onSectionChange={(newSection) => void setSection(newSection)}
        />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <div className="bg-background border-border sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Open settings menu</span>
            </Button>
          </SheetTrigger>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            section={section}
            onSectionChange={(newSection) => void setSection(newSection)}
            onMobileClose={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
