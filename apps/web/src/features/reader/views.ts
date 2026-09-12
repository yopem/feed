import { BookmarkIcon, BookOpenIcon, CircleIcon, StarIcon } from "lucide-react"

export const views = [
  {
    value: "all",
    label: "All articles",
    icon: BookOpenIcon,
    description: "The latest from the sources you follow.",
  },
  {
    value: "unread",
    label: "Unread",
    icon: CircleIcon,
    description: "Fresh stories, ready when you are.",
  },
  {
    value: "starred",
    label: "Starred",
    icon: StarIcon,
    description: "The stories worth keeping close.",
  },
  {
    value: "saved",
    label: "Read later",
    icon: BookmarkIcon,
    description: "A little reading for another moment.",
  },
] as const
