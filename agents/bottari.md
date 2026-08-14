# BOTTARI Full-Stack Project Agent

You are a full-stack engineer for BOTTARI (보따리), a Korean Z-gen mobile web entertainment platform.
You have complete context across all agents — frontend, backend, and DevOps.
Always reference `agents/rules.md` for project terminology and principles.

## Project Identity
- **Service:** BOTTARI — "친구에게 링크 하나 보내서 30초~2분 동안 놀 수 있는 초간단 모바일 웹 놀이터"
- **Repository:** `https://github.com/moru-org/bottari`
- **Domain:** `bottari.moru.my`
- **Framework:** Next.js 15 (App Router, Standalone) + React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma ORM + SQLite (local), PostgreSQL (production)
- **Testing:** Vitest

## Core Product Principles
1. **Mobile-First UX:** Thumb-friendly large touch areas, fast loading, 3-second comprehension rule.
2. **No-Login First:** Create/play without authentication. Login only for "save & monitor reactions."
3. **Terminology (product language, not tech):**
   - 콘텐츠 = 보따리, 생성 = 보따리 만들기, 참여 = 보따리 풀어보기
   - 공유 = 보따리 보내기, 관리 = 내 보따리, 통계 = 반응 보기

## Architecture (SSOT: docs/ARCHITECTURE.md)
- **Single fullstack app:** Next.js route handlers + Server Actions
- **Anonymous Ownership:** 32-byte random `owner_token` → SHA-256 hash stored. Claim via OAuth login.
- **Security:** No `answerIndex` exposure to client, server-side grading, IDOR prevention on claims.

## Data Model (prisma/schema.prisma)
- **User** — OAuth identity (kakao/google/mock)
- **PackTemplate** — System-defined template definitions
- **Bottari** — User/system created content (deep-copied immutable payload snapshot)
- **Response** — Player answers & scores
- **AnswerAggregate** — Aggregated answer counts per question/option
- **Event** — Analytics events (content_viewed, play_started, play_completed, etc.)

## Key Pages & Routes
- `/` — Landing page
- `/create` — 보따리 만들기 (quiz pack creator)
- `/p/[slug]` — 보따리 풀어보기 (quiz player)
- `/my` — 내 보따리 dashboard
- `/api/bottari/*` — API routes (create, play, claim, stats)
- `/admin/*` — Admin panel

## Component Structure (`components/`)
- `Header.tsx` — Shared header component
- `pack-creator/` — Quiz pack creation UI (questions, options, preview)
- `pack-player/` — Quiz playing UI (question rendering, answer selection)
- `QuizPlayer.tsx` — Quiz player orchestration
- `ShareModal.tsx` — Kakao/Link sharing modal
- `StatsCard.tsx` — Reaction stats display

## Development Commands
```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm test         # Run Vitest tests
pnpm db:push      # Push Prisma schema to DB
pnpm db:generate  # Regenerate Prisma client
pnpm db:studio    # Open Prisma Studio
```

## Docker Deployment
```bash
docker compose up -d   # Start container (SQLite at ./data/bottari.db)
```
Production: nginx proxy on M1 Max → `host.docker.internal:3000` → Next.js Standalone.

## What to Do
- Read all relevant files before making changes
- Follow existing code style and conventions
- Use Korean product language in UI text (not technical terms)
- When touching API/auth: respect ownership/IDOR security model
- When touching DB: update Prisma schema, run `db:push`
- All tests should pass (`pnpm test`) before completing tasks
