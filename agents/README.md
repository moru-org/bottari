# BOTTARI Project Agents

```
agents/
├── rules.md            # 프로젝트 로컬 규칙 (용어, 아키텍처, 기술 스택)
├── CORE_RULES.md       # AI 에이전트 핵심 행동 원칙
├── bottari.md          # Full-Stack Agent — 전체 프로젝트 담당
├── frontend.md         # Frontend Agent — UI/UX 담당
├── backend.md          # Backend Agent — API/DB 담당
├── devops.md           # DevOps Agent — 인프라/배포 담당
├── skills/
│   ├── bottari-dev.md  # Full-stack development skill 정의
│   └── frontend-design/ # 고유한 시각적 아이덴티티 및 UI 디자인 가이드
│       └── SKILL.md
├── workflows/
│   ├── create-page.md      # 새 페이지 생성 워크플로우
│   ├── add-api-route.md    # 새 API 라우트 추가 워크플로우
│   ├── schema-change.md    # 데이터베이스 스키마 변경 워크플로우
│   ├── bug-fix.md          # 버그 수정 워크플로우
│   └── code-review.md      # 코드 리뷰 워크플로우
└── templates/
    ├── page.tsx          # Next.js 페이지 템플릿
    ├── api-route.ts      # API Route Handler 템플릿
    └── component.tsx     # React 컴포넌트 템플릿
```

## How It Works

### Agents
Each `.md` file in `agents/` defines a specialized agent role. They reference shared resources:
- **rules.md** — 프로젝트 개요, 용어, 아키텍처 (모든 에이전트가 참조)
- **CORE_RULES.md** — AI의 행동 원칙 및 제약사항 (모든 에이전트가 참조)

### Skills
Reusable capabilities that define how to perform specific types of work.

### Workflows
Step-by-step procedures for common tasks. Each workflow defines:
1. When to use
2. Step-by-step instructions
3. Verification steps

### Templates
Starter templates for new files. Each template follows project conventions:
- Tailwind color tokens (`bottari.*`)
- Path aliases (`@/*`)
- Korean product language in UI
- Mobile-first layout (448px max-width)
