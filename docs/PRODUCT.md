# BOTTARI (보따리) — Product Specification (SSOT)

> **"친구에게 링크 하나 보내서 30초~2분 동안 놀 수 있는 초간단 모바일 웹 놀이터"**

---

## 1. Product Definition & Vision

BOTTARI(보따리)는 복잡한 온보딩과 앱 설치 없이, 누구나 링크 하나로 친구들과 소소한 즐거움을 주고받을 수 있는 모바일 웹 소셜 인터랙티브 놀이터입니다.

- **AI 서비스가 아닙니다.**
- **MBTI 서비스가 아닙니다.**
- **단순 퀴즈 사이트가 아닙니다.**
- **사용자 간 소셜 상호작용(Social Interaction)과 바이럴 루프(Viral Loop)**에 집중하는 가벼운 엔터테인먼트 플랫폼입니다.

---

## 2. Core Loops

### 2.1 Viral Loop (바이럴 루프)
```text
Create (보따리 만들기)
  → Share (친구에게 보내기)
  → Play (보따리 풀어보기)
  → Result (결과 확인 & 점수 자랑)
  → Create Again (나도 보따리 만들기)
```

### 2.2 Retention Loop (리텐션 루프)
```text
Create (보따리 만들기)
  → Share (공유 링크 전송)
  → Monitor (내 보따리 방문)
  → See Reactions (친구들 점수 & 반응 확인)
  → Share Again / Create Again (새 보따리 제작)
```

---

## 3. Target Audience

- **Primary Target:** 한국 10대~20대 (Z세대 / 알파세대)
- **Primary Channels:** 카카오톡 채팅방, Instagram DM, Discord, X(Twitter)
- **UX Core:** **Mobile First** (엄지 손가락 친화적 큼직한 터치 영역, 빠른 로딩, 3초 이해)

---

## 4. Product Language (사용자 노출 용어)

기술적/사스(SaaS)적 어휘를 철저히 배제하고 친근한 한글 용어를 사용합니다.

| 기술/일반 용어 | BOTTARI 제품 언어 |
| :--- | :--- |
| Pack / Content | **보따리** |
| Create Pack | **보따리 만들기** |
| Play / Solve | **보따리 풀어보기** |
| Share Link | **보따리 보내기** |
| Dashboard / Manage | **내 보따리** |
| Analytics / Statistics | **반응 보기** |
| Template | **템플릿 / 추천 보따리** |

---

## 5. Pack Engine V1 — Play Formats

V1에서 지원하는 5가지 플레이 포맷:

| Format | Description | Output |
| :--- | :--- | :--- |
| **내 친구 나 얼마나 알아?** (`friend_quiz`) | 정답 있는 2~4지선다 퀴즈. 정답비율로 찐친 등급 | 0~100% 정확도 + 등급 |
| **이렇게 나야!** (`guess_me`) | creator의 실제 선택과 player의 선택 매칭 | 매칭 수/비율 + 상세 피드백 |
| **친구들이 보는 내 첫인상** (`first_impression`) | 응답 분산 집계. "나를 어떻게 봐?" | 선택지별 응답 수% |
| **나에게 익명으로 한마디** (`anonymous_feedback`) | 자유입력 텍스트 수집 (익명 메시지 보따리) | 답변 목록 |
| **밸런스 게임** (`balance`) | 2지선다 극한 선택. "둘 중 하나만 골라" | 두 옵션별 투표 비율 (예: 60/40) |

---

## 6. Authentication Strategy (Post-Creation & Anonymous Ownership)

### 6.1 No-Login First
- 보따리를 만들고 플레이하는 데 **로그인이 전혀 필요하지 않습니다.**
- 생성 즉시 고유 난수 토큰(`owner_token`)이 발급되어 브라우저 로컬 저장소에 보관됩니다.

### 6.2 Post-Creation Login Value
- 생성 완료 후 또는 결과를 본 후 **"친구들이 얼마나 풀었는지 반응 보기"**의 보상을 제공하며 로그인을 유도합니다.
- 로그인 시 로컬에 보관된 `owner_token`을 서버에 제시하여 생성했던 보따리들의 소유권을 계정으로 일괄 귀속(Claim)합니다.

---

## 7. Template System

18종의 predefined 템플릿을 제공하여 사용자가 바로 보따리를 시작할 수 있습니다:

| Category | Count | Examples |
| :--- | :--- | :--- |
| 친구 (Friend) | 5 | 나 얼마나 잘 알아?, 우리 우정 레벨?, 여행 궁합 |
| 연재 (Love) | 5 | 이상형 맞혀봐, 연애 밸런스, 썸 신호 고사 |
| 밸런스 (Balance) | 5 | 극한 밸런스 게임, 죽음의 매운맛, 음식 대전 |
| 익명 (Anonymous) | 5 | 익명 한마디, 비밀창고, 칭찬 감옥 |
| 꿀잼 (Fun) | 5 | MBTI 맞히기, 취향 고사, 초능력 밸런스 |

사용자는 홈 화면에서 템플릿을 선택하거나, **새 보따리 직접 만들기**(빈칸에서 시작)로 자체 콘텐츠를 만들 수 있습니다.

---

## 8. Explicit Non-Goals (MVP 범위 외)

- 복잡한 회원가입(이메일/비밀번호) 및 프로필 편집
- AI 생성/LLM 챗봇
- 결제 및 구독 시스템
- B2B Campaign Studio (장기 로드맵으로 남김)
- 자유 서술형 주관식 / 이미지 업로드 문항
- 댓글, 친구 팔로우, 1:1 채팅

---

## 9. B2B Hypothesis (Future Vision)

향후 브랜드 및 마케터가 고객 대상의 Interactive Viral Content를 제작하고 전환율(CTA, 쿠폰 발급, 신규 유입)을 측정하는 B2B 솔루션(`BOTTARI Studio`)으로의 확장 가능성을 보존합니다.