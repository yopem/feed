"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { DialogOverlay, DialogPortal } from "./dialog"

/**
 * Command palette root component
 */
function Command({
  className,
  ...props
}: React.ComponentProps<"div"> & {
  onKeyDown?: (event: React.KeyboardEvent) => void
}) {
  return (
    <div
      data-slot="command"
      className={cn(
        "bg-card text-card-foreground flex h-full w-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Command dialog wrapper for modal presentation
 */
function CommandDialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "bg-card text-card-foreground border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-md border-2 shadow-[4px_4px_0_0_hsl(var(--foreground))] duration-200 sm:max-w-2xl",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}

/**
 * Command input search field
 */
function CommandInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="border-border flex items-center gap-3 border-b-2 px-4 py-3">
      <SearchIcon className="text-muted-foreground h-5 w-5 shrink-0" />
      <input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-8 w-full bg-transparent py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    </div>
  )
}

/**
 * Command list container for results
 */
function CommandList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-list"
      className={cn(
        "max-h-[400px] overflow-x-hidden overflow-y-auto p-2",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Command empty state
 */
function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      className={cn(
        "text-muted-foreground py-8 text-center text-sm",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Command group for organizing results
 */
function CommandGroup({
  className,
  heading,
  ...props
}: React.ComponentProps<"div"> & { heading?: string }) {
  return (
    <div
      data-slot="command-group"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {heading && (
        <div
          data-slot="command-group-heading"
          className="text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wider uppercase"
        >
          {heading}
        </div>
      )}
      <div>{props.children}</div>
    </div>
  )
}

/**
 * Command item for selectable results
 */
function CommandItem({
  className,
  selected,
  onSelect,
  ...props
}: React.ComponentProps<"div"> & {
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      data-slot="command-item"
      role="option"
      aria-selected={selected}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors outline-none select-none",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "hover:bg-accent/50",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      onClick={onSelect}
      {...props}
    />
  )
}

/**
 * Command separator
 */
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-separator"
      role="separator"
      className={cn("bg-border -mx-2 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
}
