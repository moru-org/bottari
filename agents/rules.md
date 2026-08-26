# BOTTARI 프로젝트 로컬 규칙 (agents/rules.md)

## 1. 프로젝트 개요
- **조직:** `moru-org` (Moru Organization)
- **프로젝트명:** BOTTARI (보따리)
- **로컬 경로:** `/srv/moru-org/bottari`
- **저장소:** `https://github.com/moru-org/bottari`
- **도메인:** `bottari.moru.my`
- **목적:** 친구에게 링크 하나 보내서 30초~2분 동안 놀 수 있는 초간단 모바일 웹 놀이터 MVP
- **핵심 루프:**
  - 바이럴 루프: Create → Share → Play → Result → Create Again
  - 리텐션 루프: Create → Share → Monitor → See Reactions → Share Again → Create Again

## 2. 인프라 & 배포 아키텍처 (Moru Ecosystem 연동)
- **실행 서버:** `cy-server` (`192.168.0.10`)
- **트래픽 인그레스 및 라우팅:**
  1. `cy-server Ingress Nginx (shared-nginx)`: Public Ingress (포트 80/443 SSL) → `bottari.moru.my`를 `host.docker.internal:3000` (또는 `127.0.0.1:3000`)으로 프록시
  2. `BOTTARI Container (bottari-app)`: 포트 `3000`에서 Next.js Standalone 서비스 실행
  3. `Moru Gateway 연동`: `MORU_API_URL="http://host.docker.internal:3001"`로 Moru Hub API 연동
- **컨테이너화 및 데이터 영속화:**
  - `docker-compose.yml` 및 `Dockerfile` (Multi-stage 빌드)
  - 볼륨 마운트: `./data:/app/data` (SQLite DB: `/app/data/bottari.db`)
  - 헬스체크: `/api/health`
- **환경 변수:**
  - `NEXT_PUBLIC_APP_URL="https://bottari.moru.my"`
  - `DATABASE_URL="file:/app/data/bottari.db"`

## 3. 개발 및 제품 원칙
1. **Mobile-First UX:** 한국 10~20대 타겟, 카카오톡/인스타 DM 공유 중심. 큼직한 터치 영역, 빠른 로딩, 군더더기 없는 UI.
2. **No-Login First (익명 생성 우선):** 생성/참여는 로그인 없이 즉시 가능. 로그인은 생성 후 "내 보따리 저장 및 반응 확인"을 위한 보관함 목적.
3. **용어 원칙:**
   - 콘텐츠 = 보따리
   - 생성 = 보따리 만들기
   - 참여 = 보따리 풀어보기
   - 공유 = 보따리 보내기
   - 관리/대시보드 = 내 보따리
   - 통계 = 반응 보기

## 4. 기술 스택
- **Framework:** Next.js 15 (App Router, Standalone) + React 19 + TypeScript
- **Styling:** Tailwind CSS (모바일 반응형 최적화)
- **DB & ORM:** Prisma ORM + SQLite (`./data/bottari.db`)
- **인증:** SSO 기반 (OAuth) 및 익명 소유권(Anonymous Ownership Token) Claim 시스템
- **테스트:** Vitest
