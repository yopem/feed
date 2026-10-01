import { eq } from "drizzle-orm"

import { db } from "db/index"
import { memberships, workspaces } from "db/schema/workspaces"
import { createId } from "utils/id"

export function listWorkspaces(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      role: memberships.role,
    })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, userId))
}

export async function createWorkspace(userId: string, name: string) {
  const workspace = { id: createId(), name, role: "owner" as const }
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({ id: workspace.id, name })
    await tx
      .insert(memberships)
      .values({ workspaceId: workspace.id, userId, role: workspace.role })
  })

  return workspace
}
