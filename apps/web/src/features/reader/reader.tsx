import * as stylex from "@stylexjs/stylex"
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
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  welcome: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
    textAlign: "center",
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
  },
  page: {
    minHeight: "100dvh",
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    display: "flex",
    flexDirection: "column",
    paddingBlock: { default: 28, "@media (max-width: 700px)": 24 },
    paddingInline: { default: 40, "@media (max-width: 700px)": 24 },
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  main: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr 380px",
      "@media (min-width: 701px) and (max-width: 1000px)": "1fr 340px",
      "@media (max-width: 700px)": "1fr",
    },
    alignItems: "center",
    gap: {
      default: 80,
      "@media (min-width: 701px) and (max-width: 1000px)": 40,
      "@media (max-width: 700px)": 32,
    },
    width: "100%",
    maxWidth: { default: 1000, "@media (max-width: 700px)": 380 },
    margin: "auto",
    paddingBlock: { default: 72, "@media (max-width: 700px)": 48 },
    paddingInline: 0,
  },
  introHeading: {
    marginBlock: 18,
    marginInline: 0,
    fontSize: "clamp(36px, 4vw, 52px)",
    fontWeight: 650,
    letterSpacing: "-2px",
    lineHeight: 1.1,
  },
  introDescription: {
    margin: 0,
    maxWidth: 370,
    color: tokens["--muted-foreground"],
    fontSize: 15,
    lineHeight: 1.7,
  },
  features: {
    display: { default: "grid", "@media (max-width: 700px)": "none" },
    gap: 20,
    marginTop: 36,
  },
  feature: {
    display: "flex",
    gap: 14,
    fontSize: 12,
    color: tokens["--muted-foreground"],
  },
  featureNumber: { paddingTop: 2, fontVariantNumeric: "tabular-nums" },
  featureTitle: {
    display: "block",
    color: tokens["--foreground"],
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 3,
  },
  paragraph: { margin: 0 },
  heading: {
    margin: 0,
    fontSize: "inherit",
    fontWeight: "inherit",
    lineHeight: "inherit",
  },
  signInCard: { width: "100%", maxWidth: 384 },
  setupCard: { width: "100%", maxWidth: 448 },
  fullWidth: { width: "100%" },
  icon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  signInNote: {
    color: tokens["--muted-foreground"],
    marginTop: 16,
    marginBottom: 0,
    fontSize: 12,
    lineHeight: 1.625,
  },
  cardFooter: {
    color: tokens["--muted-foreground"],
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
    fontSize: 12,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: { default: "nowrap", "@media (max-width: 700px)": "wrap" },
    gap: 12,
    color: tokens["--muted-foreground"],
    fontSize: 11,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
  },
  onboardingContent: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingBlock: 48,
  },
  setupSteps: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  currentStep: { color: tokens["--foreground"], fontWeight: 600 },
  link: {
    color: tokens["--foreground"],
    textUnderlineOffset: 4,
    ":focus-visible": {
      outlineColor: tokens["--foreground"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 3,
    },
  },
})

const workspaceName = z
  .string()
  .trim()
  .min(1, "Enter a workspace name.")
  .max(80, "Use 80 characters or fewer.")

export function Reader() {
  const session = useSession()

  if (session.isPending)
    return (
      <main {...stylex.props(styles.welcome)}>
        <Brand />
        <output>Opening your reading space…</output>
      </main>
    )

  if (session.isError)
    return (
      <main {...stylex.props(styles.welcome)}>
        <Brand />
        <h1 {...stylex.props(styles.heading)}>Could not connect</h1>
        <p role="alert" {...stylex.props(styles.paragraph)}>
          {session.error.message}
        </p>
        <Button onClick={() => void session.refetch()}>Try again</Button>
        <a
          {...stylex.props(styles.link)}
          href={`${clientEnv.VITE_SERVER_URL}/auth/login`}
        >
          Sign in again
        </a>
      </main>
    )

  if (!session.data.user) return <SignIn />

  return (
    <SignedInReader key={session.data.user.id} name={session.data.user.name} />
  )
}

function SignIn() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Brand />
        <ThemeButton />
      </header>
      <main {...stylex.props(styles.main)}>
        <section aria-labelledby="signin-heading">
          <h1 id="signin-heading" {...stylex.props(styles.introHeading)}>
            A home for
            <br />
            your reading.
          </h1>
          <p {...stylex.props(styles.introDescription)}>
            Follow independent voices, save a good story, and pick up where you
            left off.
          </p>
          <div {...stylex.props(styles.features)}>
            <div {...stylex.props(styles.feature)}>
              <span {...stylex.props(styles.featureNumber)}>01</span>
              <p {...stylex.props(styles.paragraph)}>
                <strong {...stylex.props(styles.featureTitle)}>
                  Choose your sources
                </strong>
                Follow RSS and Atom feeds in one place.
              </p>
            </div>
            <div {...stylex.props(styles.feature)}>
              <span {...stylex.props(styles.featureNumber)}>02</span>
              <p {...stylex.props(styles.paragraph)}>
                <strong {...stylex.props(styles.featureTitle)}>
                  Read at your pace
                </strong>
                Keep unread stories, stars, and a read-later list.
              </p>
            </div>
          </div>
        </section>
        <Card xstyle={styles.signInCard}>
          <CardHeader>
            <CardTitle>
              <h2 {...stylex.props(styles.heading)}>Welcome to Feed</h2>
            </CardTitle>
            <CardDescription>
              Sign in to your reading workspace.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <Button
              variant="default"
              xstyle={styles.fullWidth}
              render={
                <a
                  href={`${clientEnv.VITE_SERVER_URL}/auth/login`}
                  aria-label="Continue with Google"
                />
              }
            >
              Continue with Google
              <ArrowRightIcon
                {...stylex.props(styles.icon)}
                aria-hidden="true"
              />
            </Button>
            <p {...stylex.props(styles.signInNote)}>
              You'll continue through Yopem's secure Google sign-in, then return
              here.
            </p>
          </CardPanel>
        </Card>
      </main>
      <footer {...stylex.props(styles.footer)}>
        <span>Feed reading Open-source software.</span>
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
      <main {...stylex.props(styles.welcome)}>
        <Brand />
        <output>Loading workspaces…</output>
      </main>
    )

  if (workspaces.isError)
    return (
      <main {...stylex.props(styles.welcome)}>
        <h1 {...stylex.props(styles.heading)}>Could not load workspaces</h1>
        <p role="alert" {...stylex.props(styles.paragraph)}>
          {workspaces.error.message}
        </p>
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
        <main {...stylex.props(styles.page)}>
          <header {...stylex.props(styles.header)}>
            <Brand />
            <SignOutButton />
          </header>
          <div {...stylex.props(styles.onboardingContent)}>
            <div
              {...stylex.props(styles.setupSteps)}
              aria-label="Getting started"
            >
              <span aria-current="step" {...stylex.props(styles.currentStep)}>
                1. Create workspace
              </span>
              <span>2. Follow your first feed</span>
            </div>
            <Card xstyle={styles.setupCard}>
              <CardHeader>
                <CardTitle>
                  <h1 {...stylex.props(styles.heading)}>
                    Create your reading space
                  </h1>
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
              <CardFooter xstyle={styles.cardFooter}>
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
