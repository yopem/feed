# Agent Instructions

## Scope and priority

- Read the closest project-specific `AGENTS.md` before changing code.
- If a user asks to update `AGENTS.md` only, edit only `AGENTS.md`. Do not
  change source files, dependencies, lockfiles, or generated files.
- Before coding, query available codebase memory for prior decisions, plans,
  blockers, and relevant implementation context.
- Inspect existing callers, types, tests, and configuration before editing.
- Make smallest complete change. Reuse existing code before adding helpers,
  abstractions, dependencies, or configuration.
- Preserve unrelated user changes. Never reset, delete, or overwrite them.

## Standard stack

- **Package manager and runtime:** Bun with workspace support and ESM.
- **Language:** TypeScript 7.
- **Frontend:** React 19, TanStack Start, TanStack Router, TanStack Query, and
  TanStack React Form.
- **Styling:** Tailwind CSS 4, Base UI, coss UI, `tw-animate-css`, and
  `next-themes`.
- **Backend:** Hono, Hono RPC, and OpenAPI through `@hono/zod-openapi`.
- **AI:** TanStack AI through `@tanstack/ai`, with OpenAI or OpenRouter
  providers. Use `Bun.Image` for media processing when needed.
- **Database:** PostgreSQL and Drizzle ORM through the native Bun SQL driver.
- **Authentication:** OpenAuth with cookie-based sessions.
- **Cache:** Redis through Bun's native Redis client.
- **Storage:** Cloudflare R2 through Bun's native S3 client.
- **Validation:** Zod 4. Import `zod/compile` in each application entrypoint
  before schemas are defined. See
  https://zod.dev/blog/introducing-z-compile.
- **Environment:** native `import.meta.env` accessed through typed helpers in
  `packages/env`.

Bun is the package manager, runtime, test runner, and command entrypoint. Vite
is allowed only where frontend builds require it. Linting, formatting, tests,
and package management must not be moved back into another toolchain.

## Repository layout

When this monorepo layout exists, use these boundaries:

```text
apps/
  web/       public TanStack Start app (port 3000)
  admin/     admin TanStack Start app (port 3001)
  server/    Hono API server (port 4000)
packages/
  db/        Drizzle schema, migrations, and data-access services
  auth/      OpenAuth client and subjects
  rpc/       Hono RPC client and TanStack Query bindings
  ui/        shared UI components and theme
  utils/     shared crypto, IDs, dates, and validation helpers
  env/       typed server and client environment helpers
  cache/     Redis client and cache helpers
```

Web and admin code uses feature-first organization:

- Domain code belongs in `src/features/<domain>/`.
- Shared application code belongs in `src/components/`.
- Keep feature components, hooks, and queries together.

## Architecture boundaries

Use this dependency direction:

```text
apps/web|admin → packages/rpc → apps/server routes → packages/db services → schema
```

- Apps call the typed API client. Apps never import SQL, Drizzle, or database
  services directly.
- All database access lives in `packages/db/src/services/`.
- Generate IDs with the existing helper in `packages/utils`.
- Keep server routers thin: authentication, validation, authorization, and
  orchestration only.
- Keep reusable domain logic in services or shared package modules.
- Keep `@hono/zod-openapi` imports in the server route layer. Use
  `hono/client` from `packages/rpc` for the typed client.
- Store import restrictions and package overrides in `.oxlintrc.json`.
- Allow `drizzle-orm` imports only in `packages/db`.
- Keep `import/no-relative-parent-imports` enabled; use package subpaths instead
  of `../` imports.
- Do not create barrel files that only re-export modules. Import concrete
  modules through package subpaths.
- An `index.ts` is allowed when it contains real assembly or initialization
  logic, such as app assembly, router composition, database setup, cache setup,
  or environment parsing.

## Hono API and OpenAPI

- Build the backend with `OpenAPIHono` from `@hono/zod-openapi`.
- Define request and response schemas with Zod.
- Define documented routes with `createRoute`, then register them with
  `app.openapi`.
- Keep Hono RPC and OpenAPI definitions on the same route tree so
  `hc<AppType>()` remains the single typed client contract.
- Mount domain routes under `/rpc` using flat paths such as
  `/rpc/category/list`.
- Serve the OpenAPI specification at `/rpc/spec.json`.
- Expose interactive documentation at `/rpc/doc` when configured.
- Put authentication and role checks in Hono middleware, such as
  `requireAuth` and `requireAdmin`.
- Export the Hono app as a named export. Do not add a default fetch-handler
  export when it would cause Bun to start an unintended extra server.
- Keep CORS, auth middleware, error handling, and route mounting in the server
  entrypoint.

For a server organized under `apps/server/src`, use:

- `index.ts` for Hono app assembly, CORS, auth middleware, `/auth` callback
  routes, `/rpc` routes, OpenAPI, and generic error handling.
- `middleware/` for auth and request pipeline middleware, including rate limits.
- `lib/` for shared server errors, context, crypto, and helpers.
- `routers/` for one Hono RPC module per domain, composed by the router entrypoint.
- `handlers/` for OAuth callbacks and other HTTP handlers.
- `storage/` for R2 operations, image-to-WebP conversion, and magic-byte checks.
- `api/` for TanStack AI providers, tools, and media orchestration.
- `scripts/` for seed and maintenance scripts outside runtime code.

## Environment and validation

- Read application environment values only through `packages/env`.
- `packages/env` must use native `import.meta.env` and expose typed values.
- Do not read `.env` directly from application code.
- Do not use `process.env` for application configuration.
- Do not add a custom application environment selector.
- Expose only intentionally public values to client bundles.
- Validate environment values with Zod in `packages/env`.
- Import `"zod/compile"` before importing or defining application schemas.
- Keep secrets server-only. Never expose credentials through client environment
  exports, logs, errors, or OpenAPI examples.
- Skip environment validation in CI and during lint.
- Keep test environment setup in the test preload and route it through the
  same typed environment package.
- `.env` at repository root is not committed and supplies build/runtime values.
- Use native environment metadata when a mode or build state is needed.
- Server runs on `4000` (`SERVER_PORT`), web on `3000` (`WEB_PORT`), and admin
  on `3001` (`ADMIN_PORT`).
- OpenAuth uses `AUTH_ISSUER`. Session cookies are `access_token` (1 day) and
  `refresh_token` (7 days), `httpOnly`, `sameSite: none` in production and
  `lax` in development, and secure when `COOKIE_DOMAIN` is set or the app runs
  in production.

## TanStack and application patterns

- **TanStack Query:** use the typed `hc<AppType>()` client from `packages/rpc`
  inside query and mutation hooks. Do not call raw `fetch` from components or
  duplicate API route types.
- **TanStack React Form:** use `useForm` from `@tanstack/react-form` with Zod
  validators. Required fields validate on blur and submit, never on change or
  mount, so untouched fields show no error.
- **Server-only web/admin logic:** use `createServerFn`. Mark client
  components with `"use client"` when required by the framework.
- **TanStack AI:** keep model calls, tools, prompts, and provider setup in
  server-side AI modules. Do not add another AI SDK.
- Use existing coss UI and Base UI primitives before creating new UI controls.
- Use `lucide-react` icons only, with the `Icon` suffix in import names.

## Code style

- No semicolons. Use double quotes, 80-character lines, and trailing commas.
- Put type imports before value imports. Keep external, workspace, internal,
  and sibling imports in that order.
- Use workspace package names or configured aliases instead of relative parent
  imports.
- Omit file extensions from imports, let the bundler handle it.
- Prefer inferred types. Add explicit return types only when needed.
- Avoid unsafe type assertions. Never use `as unknown as`, `as any`, or casts
  to `any`; fix types at their source with real types, generics, or type guards.
- React components and hooks must use named `export function` declarations.
  Never use `export default` for React code.
- Prefer function declarations. Use arrow functions only when needed, such as
  inline callbacks, closures, or APIs that require a function expression.
- Use `const` whenever reassignment is unnecessary.
- Do not use `console.log`; use `console.error`, `console.warn`, or
  `console.info` when logging is necessary.
- Do not use `await import()`. Use static imports.
- Do not add comments or JSDoc to explain code that can be made clear through
  naming and structure.
- Fix lint violations at their root. Do not disable rules to silence errors.
- Components and functions must be reusable, focused, and easy to understand.

## Tooling and commands

Configuration ownership is explicit:

- `.oxlintrc.json` is the lint configuration.
- `.oxfmtrc.json` is the formatting configuration.
- `bunfig.toml` contains Bun test and preload configuration.
- `vite.config.ts` is for frontend build configuration only.

Use Bun commands:

```sh
bun install
bun run check                       # format, lint, and typecheck
bun test                            # all tests
bun test apps/server                # server tests

bun run dev                         # all configured apps
bun run --filter server dev         # server development
bun run build                       # all configured builds
bun run --filter server build       # server build

bun run lint                        # lint
bun run lint:fix                    # lint with fixes
bun run format:check                # format check
bun run format:write                # format files
bun run typecheck                   # typecheck

bun run --filter db db:generate     # generate migrations
bun run --filter db db:migrate      # run migrations
bun run --filter db db:studio       # open database studio
bun run --filter server seed        # seed data
```

After pulling changes, run `bun install` so workspace dependencies and patches
are applied.

## Build and deployment

- Build the server with `bun build --target bun` to
  `apps/server/dist/index.js`.
- Run the built server with `bun run dist/index.js`.
- Use `oven/bun` for server Docker build and runtime images.
- Web and admin builds output `dist/client` and `dist/server`.
- Serve built web/admin apps with `srvx` and the configured app port.
- Docker builds use `CI=true` and pass required public environment arguments.

## Testing rules

- Every source change must update its matching test when behavior changes.
- Keep tests in a sibling `test/` directory mirroring the `src/` path.
- Use Bun's test runner and import test helpers from `"bun:test"`.
- Run relevant tests after every source change. Run `bun run check` before
  finishing.
- Test server environment setup through `apps/server/test/setup.ts` as a Bun
  preload and use `packages/env`.
- Do not add another test framework or duplicate test configuration.
- Documentation-only changes do not need source tests, but must be checked for
  stale tool or architecture references.

## Generated, runtime, and protected files

- Do not manually edit generated route trees or framework caches.
- `routeTree.gen.ts` and `.tanstack/` are generated and ignored.
- Keep Bun-only APIs such as `Bun.serve`, `Bun.Image`, `bun:sql`, and Bun's
  native Redis/S3 clients in server-side code.
- Do not commit secrets, `.env`, build output, dependency caches, or temporary
  files.

## Git and completion

- Keep one commit per feature, fix, or context switch.
- Check `git status` before and after work.
- Do not include unrelated files in a commit.
- Final response must state changed files, checks run, and any skipped check.
