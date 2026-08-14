# BOTTARI (보따리) 🎒

> **친구에게 링크 하나 보내서 30초~2분 동안 놀 수 있는 초간단 모바일 웹 놀이터**

---

## 🚀 Key Features

1. **무로그인 초고속 생성 (No-Login First):**
   - 로그인 없이 즉시 "나를 얼마나 알아?" 퀴즈 보따리 제작
   - 원클릭으로 카카오톡/인스타 DM 공유 링크 발급
2. **무마찰 소유권 전환 (Anonymous Ownership Claim):**
   - 브라우저에 저장된 고유 토큰(`owner_token`)을 통해 로그인 시 내 계정으로 한 번에 귀속
3. **바이럴 루프 (Viral Loop):**
   - 친구의 보따리를 풀고 바로 자신의 보따리를 생성하는 연쇄 유입 구조
4. **리텐션 & Fun 대시보드 (Retention & Reactions):**
   - 총 조회수, 참여수, 완료수, 완료율, 평균 점수, 공유수 실시간 집계
   - "가장 많이 틀린 문제", "100점 만점 친구" 등 재방문 유도 통계

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Mobile-First)
- **Database & ORM:** Prisma ORM (SQLite / PostgreSQL)
- **Test:** Vitest

---

## 📦 Getting Started

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

### 3. 데이터베이스 초기화
```bash
pnpm db:push
```

### 4. 개발 서버 실행
```bash
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속

### 5. 테스트 실행
```bash
pnpm test
```

---

## 📚 Documentation
- [제품 사양서 (PRODUCT.md)](docs/PRODUCT.md)
- [아키텍처 명세서 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
