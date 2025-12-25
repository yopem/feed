import { createORPCClientFromLink, createORPCLink } from "./shared"

export const clientApi = createORPCClientFromLink(createORPCLink())
