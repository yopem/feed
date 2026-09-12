import { ArrowUpRightIcon } from "lucide-react"
import { useState } from "react"
import { Brand, ThemeButton } from "web/components/brand"
import { SignOutButton } from "web/components/sign-out-button"
import { ValueForm } from "web/components/value-form"
import { WorkspaceReader } from "web/features/reader/workspace-reader"
import { z } from "zod"

import { clientEnv } from "env/client"
import { useCreateWorkspace, useSession, useWorkspaces } from "rpc/reader"
import { Button } from "ui/button"
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
        <p role="status">Opening your reading space…</p>
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
        <div className="eyebrow">YOUR OWN CORNER OF THE WEB</div>
        <h1>
          Good reading.
          <br />
          <span>On your terms.</span>
        </h1>
        <p>
          Follow the sources you trust. Keep the stories that matter. A quiet
          home for your RSS feeds, without the noise.
        </p>
        <a
          className="button primary signin-button"
          href={`${clientEnv.VITE_SERVER_URL}/auth/login`}
        >
          Continue with Google <ArrowUpRightIcon aria-hidden="true" />
        </a>
        <span className="signin-note">Your feeds, in one place.</span>
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
        <p role="status">Loading workspaces…</p>
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
        <main className="welcome onboarding">
          <Brand />
          <div className="eyebrow">WELCOME TO FEED</div>
          <h1>A place for your curiosity.</h1>
          <p>
            Create your first workspace, then add the RSS feeds you want to
            follow.
          </p>
          <ValueForm
            label="Workspace name"
            placeholder="My reading space"
            submitLabel="Create workspace"
            schema={workspaceName}
            onSubmit={createWorkspace}
          />
          <SignOutButton />
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
