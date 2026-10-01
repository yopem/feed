import { ArrowRightIcon } from "lucide-react"
import { useState } from "react"
import { Brand, ThemeButton } from "web/components/brand"
import { SignOutButton } from "web/components/sign-out-button"
import { ValueForm } from "web/components/value-form"
import { WorkspaceReader } from "web/features/reader/workspace-reader"
import { z } from "zod"

import { clientEnv } from "env/client"
import { useCreateWorkspace, useSession, useWorkspaces } from "rpc/reader"
import { Button } from "ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
  CardFooter,
} from "ui/card"
import { Modal } from "ui/dialog"

const workspaceName = z
  .string()
  .trim()
  .min(1, "Enter a workspace name.")
  .max(80, "Use 80 characters or fewer.")

export function Reader() {
  const session = useSession()

  if (session.isPending)
    return (
      <main className="welcome">
        <Brand />
        <output>Opening your reading space…</output>
      </main>
    )

  if (session.isError)
    return (
      <main className="welcome">
        <Brand />
        <h1>Could not connect</h1>
        <p role="alert">{session.error.message}</p>
        <Button onClick={() => void session.refetch()}>Try again</Button>
        <a href={`${clientEnv.VITE_SERVER_URL}/auth/login`}>Sign in again</a>
      </main>
    )

  if (!session.data.user) return <SignIn />

  return (
    <SignedInReader key={session.data.user.id} name={session.data.user.name} />
  )
}

function SignIn() {
  return (
    <div className="signin-page">
      <header className="signin-header">
        <Brand />
        <ThemeButton />
      </header>
      <main className="signin-main">
        <section className="signin-intro" aria-labelledby="signin-heading">
          <span className="intro-label">RSS, without the distractions</span>
          <h1 id="signin-heading">
            A home for
            <br />
            your reading.
          </h1>
          <p>
            Follow independent voices, save a good story, and pick up where you
            left off.
          </p>
          <div className="signin-features">
            <div>
              <span>01</span>
              <p>
                <strong>Choose your sources</strong>Follow RSS and Atom feeds in
                one place.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>Read at your pace</strong>Keep unread stories, stars,
                and a read-later list.
              </p>
            </div>
          </div>
        </section>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <h2>Welcome to Feed</h2>
            </CardTitle>
            <CardDescription>
              Sign in to your reading workspace.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <Button
              variant="default"
              className="w-full"
              render={
                <a
                  href={`${clientEnv.VITE_SERVER_URL}/auth/login`}
                  aria-label="Continue with Google"
                />
              }
            >
              Continue with Google <ArrowRightIcon aria-hidden="true" />
            </Button>
            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
              You'll continue through Yopem's secure Google sign-in, then return
              here.
            </p>
          </CardPanel>
          <CardFooter className="text-muted-foreground border-t text-xs">
            New here? Your account is created when signup is enabled.
          </CardFooter>
        </Card>
      </main>
      <footer className="signin-footer">
        <span>Independent reading. Open-source software.</span>
        <span>AGPL-3.0</span>
      </footer>
    </div>
  )
}

function SignedInReader({ name }: { name: string }) {
  const workspaces = useWorkspaces()
  const create = useCreateWorkspace()
  const [selectedId, setSelectedId] = useState("")
  const [creating, setCreating] = useState(false)

  const workspace =
    workspaces.data?.find((item) => item.id === selectedId) ??
    workspaces.data?.[0]

  async function createWorkspace(value: string) {
    const created = await create.mutateAsync({ name: value })
    setSelectedId(created.id)
    setCreating(false)
  }

  if (workspaces.isPending)
    return (
      <main className="welcome">
        <Brand />
        <output>Loading workspaces…</output>
      </main>
    )

  if (workspaces.isError)
    return (
      <main className="welcome">
        <h1>Could not load workspaces</h1>
        <p role="alert">{workspaces.error.message}</p>
        <Button onClick={() => void workspaces.refetch()}>Try again</Button>
      </main>
    )

  return (
    <>
      {workspace ? (
        <WorkspaceReader
          key={workspace.id}
          name={name}
          workspace={workspace}
          workspaces={workspaces.data}
          onSwitch={setSelectedId}
          onCreate={() => setCreating(true)}
        />
      ) : (
        <main className="onboarding">
          <header className="signin-header">
            <Brand />
            <SignOutButton />
          </header>
          <div className="onboarding-content">
            <div className="setup-steps" aria-label="Getting started">
              <span aria-current="step">1. Create workspace</span>
              <span>2. Follow your first feed</span>
            </div>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  <h1>Create your reading space</h1>
                </CardTitle>
                <CardDescription>
                  A workspace keeps your feeds and reading list together. Give
                  yours a name.
                </CardDescription>
              </CardHeader>
              <CardPanel>
                <ValueForm
                  label="Workspace name"
                  placeholder="My reading space"
                  submitLabel="Create workspace"
                  schema={workspaceName}
                  onSubmit={createWorkspace}
                />
              </CardPanel>
              <CardFooter className="text-muted-foreground border-t text-xs">
                You can create separate workspaces for other interests later.
              </CardFooter>
            </Card>
          </div>
        </main>
      )}
      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="Create a workspace"
        description="Keep a separate collection of feeds for a project, a team, or yourself."
      >
        <ValueForm
          label="Workspace name"
          placeholder="My reading space"
          submitLabel="Create workspace"
          schema={workspaceName}
          onSubmit={createWorkspace}
        />
      </Modal>
    </>
  )
}
