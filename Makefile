.PHONY: dev build start lint test docker-up docker-down docker-build clean help agents

# Default target
help: ## Show available commands
	@echo "BOTTARI - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  dev          - Start Next.js dev server"
	@echo "  build        - Production build"
	@echo "  start        - Start production server"
	@echo "  lint         - Run ESLint"
	@echo "  test         - Run Vitest tests"
	@echo ""
	@echo "Database:"
	@echo "  db-push      - Push Prisma schema to DB"
	@echo "  db-generate  - Regenerate Prisma client"
	@echo "  db-studio    - Open Prisma Studio"
	@echo ""
	@echo "Docker:"
	@echo "  docker-up    - Start Docker container"
	@echo "  docker-down  - Stop Docker container"
	@echo "  docker-build - Build and start Docker container"
	@echo ""
	@echo "Agents:"
	@echo "  agents       - List all agents"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean        - Remove build artifacts"

# Development
dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

test:
	pnpm test

# Database
db-push:
	pnpm db:push

db-generate:
	pnpm db:generate

db-studio:
	pnpm db:studio

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose up --build -d

# Agents
agents:
	@echo "BOTTARI Agents"
	@echo "==============="
	@find agents -name "*.md" -type f | sort | while read f; do \
		echo "  $$f"; \
	done

# Cleanup
clean:
	rm -rf .next
	rm -rf node_modules/.vite
