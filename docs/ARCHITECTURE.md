# BOTTARI (보따리) — Architecture Specification (SSOT)

---

## 1. System Architecture

BOTTARI는 분산 인프라의 복잡성을 지양하고, **Next.js 단일 풀스택 + 경량 RDBMS**를 기반으로 초경량/고성능 모바일 웹 애플리케이션으로 설계되었습니다.

```text
+-----------------------------------------------------------+
|                    Browser (Mobile Web)                   |
|  - LocalStorage: owner_tokens                             |
|  - UI: Next.js Client Components (Tailwind CSS)           |
+-----------------------------------------------------------+
                              │
                              │ HTTPS / JSON API & Server Actions
                              ▼
+-----------------------------------------------------------+
|               Next.js 15 Fullstack App                    |
|  ├── Route Handlers (/api/bottari, /api/auth, /api/my)    |
|  ├── Security: HMAC Session, SHA-256 Token Hashing        |
|  └── Data Layer: Prisma ORM                               |
+-----------------------------------------------------------+
                              │
                              │ SQL (Prisma Client)
                              ▼
+-----------------------------------------------------------+
|               Relational Database                         |
|  - SQLite (Local Dev / Test)                              |
|  - PostgreSQL (Production Deployments)                    |
+-----------------------------------------------------------+
```

---

## 2. Anonymous Ownership & Claim Mechanism

### 2.1 Creation Phase (익명 생성)
1. 클라이언트 또는 서버에서 32바이트 보안 난수 토큰 생성 (`owner_token` = `crypto.randomBytes(32).toString('hex')`).
2. 서버는 `SHA-256(owner_token)`을 계산하여 `ownerTokenHash` 컬럼에 저장하고, `ownerUserId`는 `NULL`로 설정.
3. 클라이언트는 생성 완료 응답으로 전달받은 `owner_token`을 브라우저 `localStorage`의 `bottari_tokens` 목록에 저장.

### 2.2 Claim Phase (소유권 귀속)
1. 사용자가 SSO(Kakao/Google/Mock)로 로그인.
2. 클라이언트는 로그인 세션이 확인되면 `localStorage`에 저장된 미귀속 `owner_token` 목록을 `POST /api/bottari/claim`으로 전송.
3. 서버 검증:
   - 입력된 `owner_token`들의 SHA-256 해시를 계산.
   - `ownerTokenHash`가 일치하고 `ownerUserId`가 `NULL`인 보따리를 조회.
   - 이미 다른 유저에게 claim된 보따리는 덮어쓸 수 없음 (IDOR 방어).
   - 일치하는 보따리의 `ownerUserId`를 현재 세션 유저의 `id`로 원자적 업데이트.
4. 클라이언트는 귀속이 완료된 토큰을 정리하고 `/my` 대시보드로 이동.

---

## 3. Data & Event Model

```text
User (1) ──< Bottari (N) ──< Response (N)
                    │
                    └──< Event (N)
```

### Event Types
- `content_viewed`: 보따리 공유 링크 접속 시점
- `play_started`: 첫 문제 풀이 시작 시점
- `play_completed`: 마지막 문제 완료 및 점수 채점 완료 시점
- `result_viewed`: 결과 화면 표시 시점
- `share_clicked`: 카카오톡 공유 또는 링크 복사 버튼 클릭 시점

### Referral Chain Tracking
- 보따리 결과 화면에서 [나도 보따리 만들기]를 누를 경우 `/create?ref=[current_slug]` 쿼리가 전달됩니다.
- 신규 보따리 생성 시 전달된 `referralId`가 이벤트 및 보따리 메타데이터에 기록되어, 어떤 원본 보따리로부터 신규 생성이 일어났는지 추적합니다.

---

## 4. Security Boundaries

1. **정답 노출 방지:** `/p/[slug]` 퀴즈 페이지 조회 시, 클라이언트에게 정답 인덱스(`answerIndex`)를 노출하지 않고 문제 및 선택지 텍스트만 전달합니다.
2. **서버 사이드 채점:** 클라이언트가 제출한 선택지 배열을 서버에서 DB의 payload와 대조하여 안전하게 채점 후 결과를 반환합니다.
3. **소유권 위변조 방지:** 평문 `owner_token`은 DB에 저장되지 않으며 오직 SHA-256 해시만 저장됩니다.
4. **Input Validation:** 문제 수(최소 3개, 최대 10개), 글자 수 제한, XSS 방지 이스케이프 및 구조 유효성 검사를 수행합니다.
5. **Private Dashboard Isolation:** `/my` 및 통계 엔드포인트는 인증된 세션의 사용자 소유 보따리만 조회하도록 격리됩니다.

---

## 5. Deployment Architecture

- **Front/API:** Vercel 또는 독립 Node.js Docker 컨테이너
- **Database:** Supabase, Neon, AWS RDS PostgreSQL (로컬 환경은 SQLite 단일 파일)
- **Zero Heavy Infrastructure:** Redis, Queue, Kafka, Worker 노드 없이 단일 풀스택으로 운영 가능
