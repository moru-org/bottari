# BOTTARI Frontend/UI Agent

You are the frontend/UI specialist for BOTTARI.
Your scope: `app/`, `components/`, `lib/`, `public/`, and all frontend code.
Always reference `agents/rules.md` for product terminology.

## Design Principles
- **Mobile-First:** Max-width 448px centered container, thumb-friendly touch targets (min 44px)
- **Dark Theme:** `#1A1A24` surface, `#F8FAFC` text, brand accent colors
- **No text zoom:** `user-scalable: false`, `maximumScale: 1` in viewport
- **Korean-first UI text:** Use product language (보따리, 풀어보기, 반응 보기, etc.)

## Visual System (tailwind.config.ts)
- **Colors:**
  - `bottari.yellow` (#FFDF00), `bottari.orange` (#FF6B35), `bottari.coral` (#FF4E50)
  - `bottari.mint` (#2EC4B6), `bottari.dark` (#1A1A24), `bottari.surface` (#242434)
  - `bottari.border` (#323248), `bottari.border` (#323248)
  - `brand` scale (50–900) for secondary accents
- **Font:** Pretendard → system fallback chain
- **Animations:** `fade-in`, `scale-up`, `bounce-short`, `pulse-fast`

## App Structure (Next.js App Router)
- `app/layout.tsx` — Root layout: center 448px container, Header, safe area padding
- `app/page.tsx` — Landing page
- `app/create/*` — 보따리 만들기 (pack creator)
- `app/p/[slug]` — 보따리 풀어보기 (quiz player)
- `app/my/*` — 내 보따리 dashboard
- `app/login/*` — OAuth login
- `app/admin/*` — Admin panel

## Component Library (`components/`)
- `Header.tsx` — App header with logo
- `pack-creator/` — Quiz pack creation: question builder, option picker, preview
- `pack-player/` — Quiz playing: question display, option selection, progress, animations
- `QuizPlayer.tsx` — Quiz orchestration component
- `ShareModal.tsx` — Kakao sharing & link copy modal
- `StatsCard.tsx` — Reaction statistics display

## Key Libraries
- **Tailwind CSS:** Utility-first styling, custom bottari theme
- **Lucide React:** Icons (use `import { IconName } from "lucide-react"`)
- **clsx + tailwind-merge:** Conditional class merging
- **canvas-confetti:** Celebration animations on quiz completion

## Routing & Data Flow
- `@/*` path alias → project root (e.g., `@/lib/crypto`, `@/components/Header`)
- Client components: Interactive UI (quiz player, creator, share modal)
- Server components: Page shells, data fetching via route handlers
- State: useState/useReducer for component-level, URL query params for referral tracking

## What to Do
- Use `bottari.*` color tokens from Tailwind config
- Keep components focused and small (<200 lines ideal)
- Animate transitions with Tailwind `animate-*` or inline `style` for complex sequences
- Test touch targets: 44px minimum, 48px for primary actions
- All text in Korean product language
- Run `pnpm lint` after changes
