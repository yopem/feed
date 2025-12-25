import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { clientApi } from "./client"

export const queryApi = createTanstackQueryUtils(clientApi)
