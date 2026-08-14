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
  → Play (보따리 풀기)
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

사용자에게 기술적/사스(SaaS)적 어휘를 철저히 배제하고 친근한 한글 용어를 사용합니다.

| 기술/일반 용어 | BOTTARI 제품 언어 |
| :--- | :--- |
| Contents / Quiz | **보따리** |
| Create Quiz | **보따리 만들기** |
| Play / Solve | **보따리 풀어보기** |
| Share Link | **보따리 보내기** |
| Dashboard / Manage | **내 보따리** |
| Analytics / Statistics | **반응 보기** |

---

## 5. MVP First Content: "나를 얼마나 알아?"

MVP에서는 단 하나의 완성도 높은 킬러 포맷에 집중합니다.

- **포맷:** 생성자가 자신에 대한 질문 3~10개를 만들고 정답을 지정하는 퀴즈 팩
- **선택지:** 2~4지선다 객관식 (기본 2지선다 취향 밸런스)
- **템플릿 예시:**
  - "내가 더 좋아하는 음식은? 치킨 vs 피자"
  - "주말에 나는? 집순이/집돌이 vs 밖으로 나가기"
  - "여행 스타일은? 계획형 vs 즉흥형"

---

## 6. Authentication Strategy (Post-Creation & Anonymous Ownership)

### 6.1 No-Login First
- 보따리를 만들고 플레이하는 데 **로그인이 전혀 필요하지 않습니다.**
- 생성 즉시 고유 난수 토큰(`owner_token`)이 발급되어 브라우저 로컬 저장소에 보관됩니다.

### 6.2 Post-Creation Login Value
- 생성이 완료된 후 또는 결과를 본 후 **"친구들이 얼마나 풀었는지 반응 보기"**의 보상을 제공하며 로그인을 유도합니다.
- 로그인 시 로컬에 보관된 `owner_token`을 서버에 제시하여 생성했던 보따리들의 소유권을 계정으로 일괄 귀속(Claim)합니다.

---

## 7. Explicit Non-Goals (MVP 범위 외)

- 복잡한 회원가입(이메일/비밀번호) 및 프로필 편집
- AI 생성/LLM 챗봇
- 결제 및 구독 시스템
- B2B Campaign Studio (장기 로드맵으로 남김)
- 자유 서술형 주관식 / 이미지 업로드 문항
- 댓글, 친구 팔로우, 1:1 채팅

---

## 8. B2B Hypothesis (Future Vision)

향후 브랜드 및 마케터가 고객 대상의 Interactive Viral Content를 제작하고 전환율(CTA, 쿠폰 발급, 신규 유입)을 측정하는 B2B 솔루션(`BOTTARI Studio`)으로의 확장 가능성을 보존합니다.
