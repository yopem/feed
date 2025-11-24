# Yopem Read

An open-source, self-hosted alternative to Feedly. A modern RSS feed reader that
brings all your favorite content into one beautiful, distraction-free interface.
Subscribe to RSS feeds, follow Reddit communities, and organize your reading
experience with powerful tagging and tracking features.

## Features

### 📰 Subscribe to RSS Feeds

Add unlimited RSS feeds from blogs, news sites, and podcasts. Track all your
favorite content sources in one centralized hub without jumping between
websites.

### 💬 Follow Reddit Communities

Subscribe to any subreddit and read posts directly in your feed reader. Jump to
Reddit discussions with one click while enjoying a clean reading experience.

### 🏷️ Organize with Tags

Group feeds by topics, priorities, or projects with custom tags. Create your
perfect organization system and find content exactly when you need it.

### 📖 Track Your Reading

Never lose your place. Mark articles as read or unread, save favorites for
later, and maintain a complete history of everything you've consumed.

### 🔗 Share Articles Publicly

Generate shareable links with password protection, expiration dates, and QR
codes. Track views, referrers, and geographic analytics for every shared
article.

### ✨ Clean Reading Experience

Focus on content, not clutter. Enjoy a beautiful, distraction-free reader with
customizable themes that automatically adapts to your preferences.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis
- **API**: tRPC with TanStack React Query
- **Authentication**: OpenAuth

## Prerequisites

### For Local Development

- [Bun](https://bun.sh) 1.3 or higher (replaces Node.js)
- PostgreSQL database
- Redis server
- Git
- **OpenAuth Issuer** - Required for authentication
  ([setup guide](https://openauth.js.org/docs/issuer/))

### For Docker Setup

- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- **OpenAuth Issuer** - Required for authentication
  ([setup guide](https://openauth.js.org/docs/issuer/))

Note: When using Docker, PostgreSQL and Redis are provided automatically.

## Installation

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yopem/read.git
cd yopem-read
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables (see
[Environment Variables](#environment-variables) section below).

4. **Run database migrations**

```bash
bun run db:migrate
```

5. **Start the development server**

```bash
bun run dev
```

6. **Access the application**

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Docker Setup

1. **Clone the repository**

```bash
git clone https://github.com/yopem/read.git
cd read
```

2. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables.

3. **Build and start containers**

```bash
docker-compose up -d
```

The application will be available at
[http://localhost:3069](http://localhost:3069)

4. **View logs** (optional)

```bash
docker-compose logs -f
```

5. **Stop containers**

```bash
docker-compose down
```

## Environment Variables

### Required Variables

| Variable              | Description                                                       | Example                                                |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string                                      | `postgresql://user:password@localhost:5432/yopem_read` |
| `REDIS_URL`           | Redis connection string                                           | `redis://localhost:6379`                               |
| `AUTH_ISSUER`         | OpenAuth issuer URL (see [OpenAuth Setup](#openauth-setup) below) | `https://auth.example.com`                             |
| `NEXT_PUBLIC_API_URL` | Public API URL                                                    | `https://api.example.com`                              |

### OpenAuth Setup

Yopem Read uses [OpenAuth](https://openauth.js.org/) for authentication. You
need to set up an OpenAuth issuer to handle user authentication.

#### Setting Up Your Issuer

1. **Follow the official guide**: Visit
   [OpenAuth Issuer Documentation](https://openauth.js.org/docs/issuer/) for
   detailed setup instructions

2. **Deploy your issuer**: You can deploy an OpenAuth issuer using:
   - Your own server
   - Serverless platforms (AWS Lambda, Cloudflare Workers, etc.)
   - Container platforms (Docker, Kubernetes)

3. **Configure the `AUTH_ISSUER` variable**: Once your issuer is running, set
   the `AUTH_ISSUER` environment variable to your issuer's URL:

   ```bash
   AUTH_ISSUER=https://your-issuer-domain.com
   ```

4. **Important**: Without a properly configured OpenAuth issuer, the application
   will not be able to authenticate users and login functionality will not work.

#### Quick Start for Development

For local development, you can run an OpenAuth issuer locally. Refer to the
[OpenAuth documentation](https://openauth.js.org/docs/issuer/) for local setup
instructions.

### Optional Variables

| Variable                        | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `REDIS_KEY_PREFIX`              | Prefix for Redis keys                                             |
| `CRON_SECRET`                   | Secret for protecting cron endpoints (recommended for production) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID                                   |
| `NEXT_PUBLIC_LOGO_URL`          | Custom logo URL                                                   |
| `NEXT_PUBLIC_SITE_TITLE`        | Custom site title                                                 |
| `NEXT_PUBLIC_SITE_DESCRIPTION`  | Custom site description                                           |
| `CF_ACCOUNT_ID`                 | Cloudflare R2 account ID (not yet implemented)                    |
| `R2_ACCESS_KEY`                 | Cloudflare R2 access key (not yet implemented)                    |
| `R2_SECRET_KEY`                 | Cloudflare R2 secret key (not yet implemented)                    |
| `R2_BUCKET`                     | Cloudflare R2 bucket name (not yet implemented)                   |
| `R2_DOMAIN`                     | Cloudflare R2 domain (not yet implemented)                        |

For a complete list of environment variables, see [.env.example](.env.example).

## Usage

1. **Access the application** at `http://localhost:3000` (or
   `http://localhost:3069` for Docker)

2. **Create an account or log in** using the authentication system

3. **Add your first RSS feed**:
   - Click the "Add Feed" button in the sidebar
   - Enter the RSS feed URL
   - Optionally add tags for organization

4. **Organize with tags**:
   - Create tags to categorize your feeds
   - Assign multiple tags to feeds for flexible organization

5. **Read and track articles**:
   - Browse articles from all your feeds
   - Mark articles as read/unread
   - Save favorites for later reading

6. **Keyboard shortcuts** are available throughout the app for efficient
   navigation

## Cron Jobs

The application includes automated cron job endpoints for maintenance tasks.
These should be called periodically using your server's crontab.

### Available Cron Endpoints

#### 1. Cleanup Expired Shares

**Endpoint:** `GET /api/cron/cleanup-expired-shares`

Removes expired article shares and disables bulk sharing for feeds that have
passed their expiration date.

**Recommended Schedule:** Every hour

**Example with curl:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/cleanup-expired-shares
```

**What it does:**

- Disables public sharing for individual articles past their expiration date
- Disables bulk sharing for feeds past their expiration date
- Disables public sharing for all articles in expired bulk-shared feeds

#### 2. Expire Old Articles

**Endpoint:** `GET /api/cron/expire-old-articles`

Marks articles as expired based on each user's retention settings.

**Recommended Schedule:** Daily (e.g., at midnight)

**Example with curl:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/expire-old-articles
```

**What it does:**

- Processes all users and their article retention settings
- Marks articles as "expired" when they exceed the configured retention period
- Updates article status from "published" to "expired"

### Security

Both cron endpoints are protected by the `CRON_SECRET` environment variable. If
`CRON_SECRET` is set, you must include it in the `Authorization` header as a
Bearer token:

```bash
Authorization: Bearer YOUR_CRON_SECRET
```

If `CRON_SECRET` is not set, the endpoints will be publicly accessible (not
recommended for production).

### Setting Up Cron Jobs

Add the following cron jobs to your server's crontab (`crontab -e`):

```bash
# Cleanup expired shares every hour
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/cleanup-expired-shares

# Expire old articles daily at midnight
0 0 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/expire-old-articles
```

Replace `YOUR_CRON_SECRET` with your actual `CRON_SECRET` value and
`your-domain.com` with your application's domain.

## Available Commands

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `bun run dev`          | Start development server with Turbopack          |
| `bun run build`        | Build for production                             |
| `bun run start`        | Start production server                          |
| `bun run lint`         | Run ESLint                                       |
| `bun run lint:fix`     | Run ESLint with auto-fix                         |
| `bun run typecheck`    | Run TypeScript type checking                     |
| `bun run format:write` | Format code with Prettier                        |
| `bun run format:check` | Check code formatting                            |
| `bun run db:studio`    | Open Drizzle Studio (database GUI)               |
| `bun run db:migrate`   | Run database migrations                          |
| `bun run db:push`      | Push schema changes to database                  |
| `bun run db:generate`  | Generate new migration                           |
| `bun run check`        | Run all quality checks (lint, typecheck, format) |

## License

This project is licensed under the [AGPL-3.0-or-later](LICENSE.md) license. This
is a copyleft license that requires any derivative works to be distributed under
the same license terms.
