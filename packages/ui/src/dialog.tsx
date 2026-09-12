import type { ReactNode } from "react"

import { Dialog } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

export function Modal({
  title,
  description,
  children,
  open,
  onOpenChange,
  className = "",
}: {
  title: string
  description?: string
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className={`dialog-popup ${className}`}>
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="dialog-description">
              {description}
            </Dialog.Description>
          ) : null}
          <Dialog.Close
            className="button icon-button dialog-close"
            aria-label="Close dialog"
          >
            <XIcon aria-hidden="true" />
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
