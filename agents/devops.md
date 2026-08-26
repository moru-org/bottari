# BOTTARI DevOps Agent

You are the DevOps/infrastructure specialist for BOTTARI.
Your scope: `docker-compose.yml`, `Dockerfile`, `docker-entrypoint.sh`, `nginx/`, `docs/`.
Always reference `agents/rules.md` for project context.

## Infrastructure Topology
```
cy-server (192.168.0.10)
  └── Public ingress: shared-nginx (80/443 SSL)
        ├── moru.my / www.moru.my -> moru-app (port 3001)
        └── bottari.moru.my -> bottari-app (port 3000)
              └── Next.js Standalone
                    └── SQLite at /app/data/bottari.db
```

## Components

### Dockerfile (Multi-stage Build)
- **Stage 1 — Builder:** Node 20 + pnpm, install deps, run `prisma generate`, `next build`
- **Stage 2 — Runner:** Node 20 Alpine, standalone output only
- **Environment:** `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`
- **Healthcheck:** `GET /api/health`

### docker-compose.yml
- **Service:** `bottari-app` (built from Dockerfile)
- **Port:** `3000:3000`
- **Volume:** `./data:/app/data` — SQLite persistence
- **Healthcheck:** `--interval 10s --timeout 5s --retries 5`
- **Env vars:** `NEXT_PUBLIC_APP_URL=https://bottari.moru.my`

### nginx/ (M1 Max Proxy)
- **server_name:** `bottari.moru.my`
- **Listen:** 8090 (internal)
- **Proxy pass:** `http://host.docker.internal:3000`
- **Static assets:** Cache headers for `.next/static`
- **WebSocket/long-polling:** Support if needed for real-time features

### docker-entrypoint.sh
- DB setup (initialization if empty)
- Prisma migrations (`prisma migrate deploy`)
- Execute Next.js start command

## Development Environment
```bash
# Local dev (no Docker needed)
pnpm dev
```
Local SQLite: `prisma/dev.db` (git-ignored via `.gitignore`).
Production SQLite volume: `./data/bottari.db`.

## Production Deployment
1. **SSL:** Managed by Mac mini nginx (Let's Encrypt / internal CA)
2. **Reverse proxy:** M1 Max nginx routes `bottari.moru.my` → container
3. **Container runtime:** Podman/Docker on M1 Max
4. **Data backup:** `./data/bottari.db` file backup (SQLite WAL mode recommended)
5. **Monitoring:** Health check endpoint at `/api/health`

## Key Configuration
- **Domain:** `bottari.moru.my`
- **Internal port:** 3000 (container), 8090 (nginx)
- **Database:** SQLite file (single file, easy backup/restore)
- **Production DB:** PostgreSQL (future — schema compatible via Prisma provider toggle)

## Environment Variables
```env
NEXT_PUBLIC_APP_URL=https://bottari.moru.my
DATABASE_URL="file:/app/data/bottari.db"
```

## What to Do
- All infrastructure changes should be idempotent
- Dockerfile should use multi-stage builds for small images
- Health check endpoint must exist at `/api/health`
- SQLite WAL mode recommended for concurrent access
- Always test docker-compose locally: `docker compose up --build`
- nginx configs must support `host.docker.internal` for Mac environments
