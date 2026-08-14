# Workflow: Create New Page

## Purpose
Standardize creation of new page routes in the Next.js App Router.

## Steps

### 1. Create Route Directory
```bash
mkdir -p app/[route-name]
```

### 2. Create `page.tsx`
Use the template at `agents/templates/page.tsx`.

### 3. Add to Navigation (if needed)
- Update `components/Header.tsx` if adding top-level nav item
- Update `agents/bottari.md` Key Pages section

### 4. Wire Up Data
- If fetching data: use Route Handler in `app/api/[route-name]/`
- If client-side: add `'use client'` directive

### 5. Verify
- Run `pnpm dev` and test in browser
- Check mobile viewport (375px, 414px, 448px)
- Ensure Korean product language in UI text
