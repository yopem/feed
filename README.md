# Yopem Feed

An open-source RSS reader inspired by classic Feedly. No threat intelligence,
admin panel, or AI features.

## Status

Early development, not full Feedly parity.

Implemented: shared Google sign-in, workspace creation/switching, RSS/Atom
subscriptions, manual/background refresh, search, unread/starred/read-later
filters, personal reading state, plain-text reading, link sharing, and dark
mode. Workspace roles are enforced locally, independent of shared auth roles.

Still pending: invitations/member management, folders, tags, shared boards,
public board links, comments/mentions, OPML import/export, and keyboard
shortcuts. Google News, Reddit, and AI are later phases.

## Local setup

Requires Bun 1.4.2 and containerized PostgreSQL/Redis.

```sh
bun install
cp .env.example .env
docker compose up -d
bun run --filter db db:migrate
bun run dev
```

Podman may run the equivalent `postgres:17-alpine` and `redis:8-alpine`
containers. Database migrations use Drizzle's native Bun SQL migrator.

Web: `http://localhost:3000`. API: `http://localhost:4000`.
`OPENAPI_ENABLED=true` enables `/rpc/doc` and `/rpc/spec.json`.

Authentication uses the existing `https://auth.yopem.com` OpenAuth service and
client ID `yopem`. The service must allow `AUTH_CALLBACK_URL`, defaulting to
`http://localhost:4000/auth/callback`. Feed does not host an issuer or need
Google client secrets. For another deployment, register its callback with the
issuer.

Sign in, create a workspace, then add a direct RSS or Atom URL, for example
`https://hnrss.org/frontpage`. Site autodiscovery is pending.
`AUTH_SIGNUP_ENABLED=false` blocks new local accounts but allows existing users.

## Verification

```sh
bun test
bun run check
bun run format:write
bun run --filter db db:generate
```

Database integration tests use a separate local database ending in `_test`. For
the default development credentials:

```sh
docker compose exec postgres createdb -U feed feed_test
DATABASE_URL=postgres://feed:feed@localhost:5432/feed_test bun run --filter db db:migrate
bun run test:integration
```

Set `TEST_DATABASE_URL` in `.env` if credentials or ports differ. Integration
tests remove only their own fixtures, never truncate existing data.

## Builds

```sh
CI=true bun run build
bun run --filter server start
bun run --filter web start
```

Use `CI=true` for checks/builds only, never runtime. Hosting requires HTTPS
origins and an approved auth callback. Publish corresponding source under AGPL
and provide users access to it.

Server output: `apps/server/dist/index.js`. Web output: `apps/web/dist/client`
and `apps/web/dist/server`, served with `srvx`. Compose currently provides data
services only; application deployment images are pending.

Feed requests reject private/reserved addresses, pin DNS, and limit time, size,
and redirects. Compressed responses are currently rejected. Lists show at most
200 matching entries; pagination and full-content extraction are pending.

Development rules live in [AGENTS.md](AGENTS.md). Detailed working notes belong
in gitignored `docs/`.

## License

[GNU Affero General Public License version 3 only](LICENSE.md), `AGPL-3.0-only`.
