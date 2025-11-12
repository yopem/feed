"use client"

import { useState } from "react"
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  Mail,
  QrCode,
  Share2,
  Twitter,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SocialShareButtonsProps {
  url: string
  title: string
  description?: string
  onQRCodeClick?: () => void
}

/**
 * Social sharing buttons component
 *
 * Provides buttons for sharing content to various social platforms
 * including Facebook, X/Twitter, LinkedIn, email, and copy link.
 *
 * @param url - The URL to share
 * @param title - The title of the content being shared
 * @param description - Optional description for the share
 * @param onQRCodeClick - Optional callback when QR code button is clicked
 */
export function SocialShareButtons({
  url,
  title,
  description,
  onQRCodeClick,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description ?? title)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
      console.error("Failed to copy:", error)
    }
  }

  const handleSocialShare = (link: string) => {
    window.open(link, "_blank", "width=600,height=600,noopener,noreferrer")
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Share this article</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleSocialShare(shareLinks.facebook)}
        >
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare(shareLinks.twitter)}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on X
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSocialShare(shareLinks.linkedin)}
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open(shareLinks.email, "_blank")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Share via Email
        </DropdownMenuItem>

        {onQRCodeClick && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onQRCodeClick}>
              <QrCode className="mr-2 h-4 w-4" />
              Show QR Code
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
