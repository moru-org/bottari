# BOTTARI (보따리) — Architecture Specification (SSOT)

> **최종 업데이트:** 2026-08-15 (V1 — UGC Pack Engine)

---

## 1. System Architecture

BOTTARI는 Next.js 단일 풀스택 + 경량 RDBMS 기반의 초경량 모바일 웹 애플리케이션입니다.

```text
+-----------------------------------------------------------+
|                    Browser (Mobile Web)                   |
|  - LocalStorage: owner_tokens                             |
|  - UI: Next.js Client Components (Tailwind CSS)           |
+-----------------------------------------------------------+
                               │
                               │ HTTPS / JSON API
                               ▼
+-----------------------------------------------------------+
|               Next.js 15 Fullstack App                    |
|  ├── Pages: /, /create, /p/[slug], /my, /admin           |
|  ├── API Routes: /api/bottari/*, /api/packs/*,           |
|  │                /api/templates/*, /api/my/*              |
|  ├── Engine: lib/engine.ts (Scoring & Aggregation)       |
|  ├── Types: lib/pack-types.ts (Pack Type System)        |
|  ├── Security: HMAC Session, SHA-256 Token Hashing        |
|  └── Data Layer: Prisma ORM                              |
+-----------------------------------------------------------+
                               │
                               │ SQL (Prisma Client)
                               ▼
+-----------------------------------------------------------+
|               Relational Database                         |
|  - SQLite (Local Dev / Test)                              |
|  - PostgreSQL (Production)                                |
+-----------------------------------------------------------+
```

---

## 2. Data Model

### 2.1 Core Entities

```text
User (1) ──< Pack (N) ──< Submission (N)
  │         │
  │         ├─< PackQuestion (N) ──< SubmissionAnswer (N)
  │         │      │
  │         │      └─< QuestionOption (N)
  │         │
  │         ├─< PackResultCharacter (N)
  │         │      │
  │         │      └─< ScoreMapping (N)
  │         │
  │         └─< Event (N)
  │
  └─< PackTemplate (N) @relation("TemplateToPack")
```

### 2.2 Key Models

| Model | Description |
| :--- | :--- |
| `Pack` | 보따리(Play Pack)의 핵심 엔티티. 고유 `slug`, 템플릿 참조, 소유자 정보 유지 |
| `PackTemplate` | predefined 보따리 템플릿. `payload`(JSON)로 질문·선택지·결과 규칙 포함 |
| `PackQuestion` | 개별 문제. `type`(single_choice, multi_choice, rating, slider, ranking, short_text, prediction) 지원 |
| `QuestionOption` | 선택지. `scores`(ScoreMapping)로 결과 캐릭터 점수 매핑 |
| `PackResultCharacter` | 결과 캐릭터(예: "찐친", "평범한 지인"). 캐릭터별 점수·비율 계산 |
| `ScoreMapping` | 선택지 → 캐릭터 점수 매핑. 정적 결과 시스템의 핵심 |
| `Submission` | 플레이 세션. 익명 세션 토큰(`sessionToken`)으로 추적 |
| `SubmissionAnswer` | 개별 문제 답변. `optionId`(객관식) 또는 `value`(자유기술) |
| `Event` | 사용자 활동 이벤트. `content_viewed`, `play_completed`, `share_clicked` 등 |

### 2.3 Play Data Flow

```text
1. Load Pack       → GET /api/bottari/[slug] (PublicQuestion[] + metadata)
2. Answer Questions → POST /api/bottari/[slug]/submit (optionId + sessionToken)
3. Scoring         → lib/engine.ts: getResult(packId)
   - 각 SubmissionAnswer의 optionId → ScoreMapping 조회
   - 캐릭터별 총점 합산 → percentage 계산
4. Result          → ScoreMapping 기반 캐릭터 점수 분포 반환 (정답 인덱스 노출 X)
```

---

## 3. Anonymous Ownership & Claim Mechanism

### 3.1 Creation Phase (익명 생성)
1. 서버에서 32바이트 보안 난수 토큰 생성 (`owner_token` = `crypto.randomBytes(32).toString('hex')`).
2. 서버는 `SHA-256(owner_token)`을 계산하여 `ownerTokenHash` 컬럼에 저장, `ownerUserId`는 `NULL`.
3. 클라이언트는 `owner_token`을 `localStorage`(`bottari_owner_tokens`)에 보관.

### 3.2 Claim Phase (소유권 귀속)
1. 사용자가 SSO(Kakao/Google/Mock)로 로그인.
2. `localStorage`의 미귀속 토큰 목록을 `POST /api/bottari/claim`으로 전송.
3. 서버 검증:
   - 입력 토큰의 SHA-256 해시와 `ownerTokenHash` 일치하는지 확인.
   - `ownerUserId`가 `NULL`인 경우에만 소유권 이전 (IDOR 방어).
   - 일치하는 모든 `Pack`의 `ownerUserId`를 인증된 세션의 `id`로 원자적 업데이트.
4. 클라이언트는 귀속 완료 토큰 정지 후 `/my` 대시보드로 이동.

---

## 4. Pack Engine — Type System & Templates

### 4.1 Pack Types (Play Formats)

| Pack Type | Description | Scoring |
| :--- | :--- | :--- |
| `friend_quiz` | 정답 있는 2~4지선다 퀴즈 | 정답/오타 비율로 등급 판정 |
| `guess_me` | creator의 선택과 매칭된 개수 계산 | 일치 수/총문제로 매칭률 계산 |
| `first_impression` | 객관식 응답 분산 집계 | 선택지별 응답 수/비율 표시 |
| `anonymous_feedback` | 자유기술 답변 수집 | 답변 목록 표시 (점수 계산 없음) |
| `balance` | 2지선다 밸런스 게임 | 두 옵션별 투표 비율 |

### 4.2 Template System
`PackTemplate` 테이블이 18종의 predefined 템플릿을 보관합니다:
- `data/pack-templates.ts`: 프론트엔드 정의 (API 응답 및 시드)
- `prisma/seed.ts`: DB 초기화 시 `PackTemplate` 삽입
- `CREATE_PACK` 시 `templateId`를 전달하면 `PackTemplate.payload`(JSON `PackDefinition`)을 파싱하여 `Pack` 생성

### 4.3 Category System (Home Page)

| Category | Name | Emoji | Description |
| :--- | :--- | :--- | :--- |
| `friend` | 친구 | 👫 | 친구 대상 퀴즈·궁합 테스트 |
| `love` | 연애 | 💖 | 연애 가치관·이상형 탐구 |
| `balance` | 밸런스 | ⚖️ | 2지선다 극한 선택 |
| `anonymous` | 익명 | 💌 | 솔직한 한마디·비밀 메시지 |
| `fun` | 꿀잼 | ⚡ | 성격·취향 테스트 |

---

## 5. Game Loop & Play Experience

### 5.1 Page Flow

```
/ (Home — Template List)
  │
  ├── Create Pack ──→ /create?template=[slug] ──→ /p/[created_slug] (auto-play)
  │
  └── Play Pack ──→ /p/[slug]
                  │
                  ├── Progress Bar (1/N, 2/N, ..., N/N)
                  ├── Question Card (option buttons / text input)
                  ├── Submit (server-side scoring)
                  │
                  └── Result Screen
                      ├── Character Distribution (bar chart)
                      ├── Share Button (카카오톡, 링크 복사)
                      └── "나도 보따리 만들기" → /create?ref=[current_slug]
```

### 5.2 API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/packs` | Public `Pack` 목록 (필터: featured) |
| `GET` | `/api/templates` | `PackTemplate` 목록 (필터: category, featured) |
| `GET` | `/api/bottari/[slug]` | Play Pack 조회 (정답 인덱스 제외) |
| `POST` | `/api/bottari/[slug]/submit` | 답변 제출 (server-side scoring) |
| `POST` | `/api/bottari/[slug]/event` | 이벤트 기록 (view, play, share 등) |
| `POST` | `/api/bottari/claim` | 소유권귀속 (owner_token → userId) |
| `GET` | `/api/my/packs` | 로그인用户的 Pack 목록 |
| `POST` | `/api/packs` | 새 Pack 생성 |

---

## 6. Security Boundaries

1. **정답/creator 선택지 노출 방지:** `GET /api/bottari/[slug]`에서 `answerIndex`/`creatorChoiceIndex` 제거 후 클라이언트에 전달.
2. **Server-side Scoring:** `lib/engine.ts`가 서버단에서 `ScoreMapping` 조회 및 종합 점수 계산.
3. **Ownership Tamper Prevention:** 평문 `owner_token`은 DB 미저장. 오직 `SHA-256` 해시만 저장.
4. **Input Validation:** 문제 수 제한, XSS 이스케이프, 구조 유효성 검사.
5. **Dashboard Isolation:** `/my` 엔드포인트는 인증 세션의 `ownerId`만 조회.

---

## 7. Deployment Architecture

- **Front/API:** Vercel, 또는 Docker 컨테이너 (Node.js)
- **Database:** SQLite (로컬/테스트), PostgreSQL (운영)
- ** 인프라:** Redis/Queue/Kafka 없이 단일 풀스택 단일 컨테이너로 운영 가능