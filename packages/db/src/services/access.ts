import { and, eq } from "drizzle-orm"

import { db } from "db/index"
import { memberships } from "db/schema/workspaces"

export class ServiceError extends Error {
  constructor(
    message: string,
    public status: 403 | 404 | 409 = 403,
  ) {
    super(message)
  }
}

export function assertRole(
  role: "owner" | "editor" | "viewer" | undefined,
  write = false,
) {
  if (!role || (write && role === "viewer")) {
    throw new ServiceError("Workspace access denied")
  }
}

export async function requireMembership(
  userId: string,
  workspaceId: string,
  write = false,
) {
  const [member] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.workspaceId, workspaceId),
      ),
    )
  assertRole(member?.role, write)
}
