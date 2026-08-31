# BusinessFlow

BusinessFlow is a portfolio-grade B2B SaaS application for running a small service business. It brings clients, projects, tasks, team workload, Kanban delivery, and an auditable activity trail into one focused workspace.

## Features

- Credentials authentication with ADMIN and EMPLOYEE roles
- Organization-level multi-tenancy enforced in every data query and mutation
- Permission-scoped dashboard, clients, projects, tasks, Kanban, and activity
- Project membership and assignee integrity checks
- Search, filters, sorting, and pagination through URL parameters
- Persistent drag-and-drop Kanban ordering
- Transactional Activity Log for important business mutations
- Responsive SaaS shell, accessible controls, and persistent light/dark themes
- Realistic demo seed and two-organization security test fixtures

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript 5.9
- Tailwind CSS 4 and Radix/shadcn-style UI primitives
- PostgreSQL 18, Prisma ORM 7, and the PostgreSQL driver adapter
- Auth.js Credentials provider with JWT sessions and bcrypt password hashes
- React Hook Form and Zod
- TanStack Table, dnd-kit, Recharts, Sonner, and next-themes
- Vitest, Testing Library, and Playwright

## Screenshots

| Login                                             | Dashboard                                                 |
| ------------------------------------------------- | --------------------------------------------------------- |
| ![BusinessFlow login](docs/screenshots/login.png) | ![BusinessFlow dashboard](docs/screenshots/dashboard.png) |

| Clients                                               | Kanban                                                    |
| ----------------------------------------------------- | --------------------------------------------------------- |
| ![BusinessFlow clients](docs/screenshots/clients.png) | ![BusinessFlow Kanban board](docs/screenshots/kanban.png) |

## Demo Accounts

| Role     | Email                         | Password   |
| -------- | ----------------------------- | ---------- |
| Admin    | `admin@businessflow.local`    | `Demo123!` |
| Employee | `employee@businessflow.local` | `Demo123!` |

These credentials are intentionally local demo data. Do not reuse the password in a real environment.

## Getting Started

Prerequisites: Node.js 24 LTS, pnpm 12, Git, and Docker Desktop with WSL2/hardware virtualization enabled.

```bash
git clone <repository-url>
cd businessflow
pnpm install
docker compose up -d
copy .env.example .env
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

On macOS/Linux, replace `copy .env.example .env` with `cp .env.example .env`. Replace the placeholder `AUTH_SECRET` before using the app outside local development.

## Environment Variables

```env
DATABASE_URL="postgresql://businessflow:businessflow@localhost:5432/businessflow?schema=public"
AUTH_SECRET="replace-with-a-random-secret"
```

`DATABASE_URL` is server-only. Organization IDs and roles are always derived from the verified session, never from browser input.

## Database Setup

`docker-compose.yml` starts PostgreSQL 18 with a persistent volume and creates `businessflow`, `businessflow_test`, and `businessflow_e2e` databases.

```bash
docker compose up -d
pnpm db:deploy
pnpm db:seed
```

To create a new development migration after changing the Prisma schema:

```bash
pnpm db:migrate --name describe_the_change
```

## Running Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Integration and E2E tests use isolated databases:

```bash
set TEST_DATABASE_URL=postgresql://businessflow:businessflow@localhost:5432/businessflow_test?schema=public
set DATABASE_URL=%TEST_DATABASE_URL%
pnpm db:deploy
pnpm test:integration

set E2E_DATABASE_URL=postgresql://businessflow:businessflow@localhost:5432/businessflow_e2e?schema=public
set DATABASE_URL=%E2E_DATABASE_URL%
pnpm db:deploy
pnpm db:seed
pnpm test:e2e
```

The examples above use Windows `cmd`; use `$env:NAME="value"` in PowerShell or `export NAME=value` on POSIX systems.

## Architecture

BusinessFlow is a modular Next.js monolith:

- Server Components query Prisma directly through a server-only data access layer.
- Client Components handle forms, filters, theme state, charts, and drag-and-drop.
- Server Actions authenticate, authorize, validate, check ownership/relationships, mutate, log activity, and revalidate affected paths.
- Prisma composite foreign keys add database-level tenant integrity for project/client and membership relations.
- Mutations and their audit entries share Prisma transactions.

## Security / Multi-tenancy

- Every business resource is constrained by `organizationId` derived from Auth.js.
- EMPLOYEE project/task access requires an existing ProjectMember relation.
- EMPLOYEE client and activity views are scoped through accessible projects.
- Foreign-tenant IDs behave like missing resources and do not reveal existence.
- ADMIN-only checks run inside every privileged Server Action.
- Zod validates every mutation; plaintext notes/descriptions are never rendered as HTML.
- Password hashes and infrastructure errors never enter serialized DTOs.
- Integration tests exercise cross-tenant reads, writes, and composite relation constraints.

## GitHub Workflow

Development uses short-lived feature branches and Conventional Commits. Each milestone is linted, type-checked, and tested before merge. GitHub Actions provisions PostgreSQL and runs the same quality gates, integration suite, production build, and Playwright scenarios.

## Future Improvements

- Invitations and secure account recovery
- Billing and subscriptions
- File attachments and object storage
- Realtime collaboration and notifications
- Client portal and invoice workflows
- Managed production deployment with observability

## License

This repository is intended as a portfolio project.
