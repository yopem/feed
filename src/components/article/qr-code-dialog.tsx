"use client"

import { useRef } from "react"
import { Download } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface QRCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

/**
 * QR Code dialog component
 *
 * Displays a QR code for the provided URL with download functionality.
 *
 * @param isOpen - Whether the dialog is open
 * @param onClose - Callback when dialog is closed
 * @param url - The URL to encode in the QR code
 * @param title - The title to display in the dialog
 */
export function QRCodeDialog({
  isOpen,
  onClose,
  url,
  title,
}: QRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    try {
      const canvas = qrRef.current?.querySelector("canvas")
      if (!canvas) {
        toast.error("Failed to generate QR code")
        return
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image")
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `qr-code-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success("QR code downloaded")
      })
    } catch (error) {
      console.error("Failed to download QR code:", error)
      toast.error("Failed to download QR code")
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>QR Code</AlertDialogTitle>
          <AlertDialogDescription>
            Scan this code to access "{title}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <div
            ref={qrRef}
            className="border-border rounded-lg border-2 bg-white p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          >
            <QRCodeCanvas value={url} size={256} level="H" marginSize={0} />
          </div>

          <p className="text-muted-foreground text-center text-sm">
            Scan with your phone's camera to open the article
          </p>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
