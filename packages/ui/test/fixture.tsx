import { useState } from "react"
import { createRoot } from "react-dom/client"

import { Button } from "ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "ui/dialog"
import { Input } from "ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Tabs, TabsList, TabsPanel, TabsTab } from "ui/tabs"
import { ThemeProvider, useTheme } from "ui/theme/theme-provider"

const workspaces = [
  { value: "daily", label: "Daily reading" },
  { value: "team", label: "Team reading" },
  { value: "disabled", label: "Unavailable" },
]

export function InteractiveFixture() {
  const [workspace, setWorkspace] = useState<string | null>("daily")
  const [open, setOpen] = useState(false)
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState(0)
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <main>
      <h1>Feed UI migration checks</h1>
      <p>
        Theme: {theme} / {resolvedTheme}
      </p>
      <Button onClick={() => setTheme("dark")}>Dark theme</Button>
      <Button onClick={() => setTheme("light")}>Light theme</Button>
      <Button onClick={() => setTheme("system")}>System theme</Button>
      <label htmlFor="workspace">Workspace</label>
      <Select value={workspace} items={workspaces} onValueChange={setWorkspace}>
        <SelectTrigger id="workspace">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          {workspaces.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              disabled={item.value === "disabled"}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <Tabs defaultValue="all">
        <TabsList aria-label="Article filters" size="sm">
          <TabsTab value="all">All articles</TabsTab>
          <TabsTab value="unread">Unread</TabsTab>
          <TabsTab value="disabled" disabled>
            Unavailable filter
          </TabsTab>
        </TabsList>
        <TabsPanel value="all">All stories</TabsPanel>
        <TabsPanel value="unread">Unread stories</TabsPanel>
      </Tabs>
      <Button
        onClick={() => {
          setComplete(false)
          setOpen(true)
        }}
      >
        Follow a feed
      </Button>
      <p>Close complete: {String(complete)}</p>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={(isOpen) => {
          if (!isOpen) setComplete(true)
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Follow RSS feed</DialogTitle>
            <DialogDescription>Enter feed URL.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <label htmlFor="feed-url">Feed URL</label>
            <Input id="feed-url" type="url" aria-describedby="feed-help" />
            <p id="feed-help">Use an https URL.</p>
          </DialogPanel>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSubmissions((count) => count + 1)
        }}
      >
        <Button onClick={() => setLoading(!loading)}>Toggle loading</Button>
        <Button type="submit" loading={loading}>
          Save feed
        </Button>
        <p>Submissions: {submissions}</p>
      </form>
      <Button render={<a href="#destination" aria-label="Read original" />}>
        Read original
      </Button>
      <h2 id="destination">Original article</h2>
    </main>
  )
}

const container = document.getElementById("root")

if (!container) throw new Error("UI fixture requires #root")

createRoot(container).render(
  <ThemeProvider>
    <InteractiveFixture />
  </ThemeProvider>,
)
