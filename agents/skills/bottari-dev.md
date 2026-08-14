# Skill: bottari-dev

## Description
End-to-end development skill for BOTTARI project. Covers full-stack changes: frontend UI, backend API, database schema, and Docker deployment.

## When to Use
- Creating or modifying features (new pages, components, API routes)
- Database schema changes
- Full-stack refactoring
- Bug fixes that span multiple layers

## Workflow

### 1. Understand the Request
- Read `agents/rules.md` for project terminology
- Read `agents/CORE_RULES.md` for constraints
- Identify scope: frontend, backend, or both?

### 2. Explore Current State
- Read relevant files (pages, components, API routes, schema)
- Understand data flow and existing patterns

### 3. Implement
- Follow existing conventions (Tailwind tokens, path aliases, Korean UI text)
- Backend: Prisma for DB, no answerIndex exposure
- Frontend: Mobile-first, 44px touch targets, dark theme

### 4. Verify
- `pnpm lint` — linting
- `pnpm test` — tests
- `pnpm db:generate` — if schema changed
- Manual verification if possible

## Key Paths
- Frontend: `app/`, `components/`
- Backend: `app/api/`, `lib/`
- Database: `prisma/schema.prisma`, `data/`
- Infra: `docker-compose.yml`, `Dockerfile`
