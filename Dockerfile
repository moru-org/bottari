# syntax=docker/dockerfile:1

# 1. Base Image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm@10.5.2

# 2. Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN pnpm build

# 4. Production Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 데이터 볼륨 디렉토리 생성
RUN mkdir -p /app/data

# Standalone 실행 파일 및 Prisma 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

VOLUME ["/app/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
