"use client"

import { useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  FacebookIcon,
  LinkedinIcon,
  MailIcon,
  QrCodeIcon,
  Share2Icon,
  TwitterIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { toast } from "@/components/ui/toast"
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
    <Menu>
      <Tooltip>
        <TooltipTrigger>
          <MenuTrigger>
            <Button variant="outline" size="sm">
              <Share2Icon className="h-4 w-4" />
              Share
            </Button>
          </MenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Share this article</TooltipContent>
      </Tooltip>

      <MenuPopup align="end" className="w-48">
        <MenuItem onClick={handleCopyLink}>
          {copied ? (
            <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="mr-2 h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </MenuItem>

        <MenuSeparator />

        <MenuItem onClick={() => handleSocialShare(shareLinks.facebook)}>
          <FacebookIcon className="mr-2 h-4 w-4" />
          Share on Facebook
        </MenuItem>

        <MenuItem onClick={() => handleSocialShare(shareLinks.twitter)}>
          <TwitterIcon className="mr-2 h-4 w-4" />
          Share on X
        </MenuItem>

        <MenuItem onClick={() => handleSocialShare(shareLinks.linkedin)}>
          <LinkedinIcon className="mr-2 h-4 w-4" />
          Share on LinkedIn
        </MenuItem>

        <MenuItem onClick={() => window.open(shareLinks.email, "_blank")}>
          <MailIcon className="mr-2 h-4 w-4" />
          Share via Email
        </MenuItem>

        {onQRCodeClick && (
          <>
            <MenuSeparator />
            <MenuItem onClick={onQRCodeClick}>
              <QrCodeIcon className="mr-2 h-4 w-4" />
              Show QR Code
            </MenuItem>
          </>
        )}
      </MenuPopup>
    </Menu>
  )
}
