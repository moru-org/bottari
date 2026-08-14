# Workflow: Add New API Route

## Purpose
Standardize creation of new API routes in BOTTARI.

## Steps

### 1. Create Route Handler
```bash
mkdir -p app/api/[route-name]
touch app/api/[route-name]/route.ts
```

### 2. Use Template
Use template at `agents/templates/api-route.ts`.

### 3. Implement Security
- Validate all inputs
- No sensitive data in responses
- Apply ownership/IDOR checks if resource belongs to a user
- Grade server-side (never expose answers)

### 4. Add Prisma Client Access
```typescript
import { getDb } from "@/lib/db";
const db = getDb();
```

### 5. Create Client Call
Create a `lib/api.ts` function or page-level fetch:
```typescript
const res = await fetch(`/api/[route-name]`);
```

### 6. Verify
- Run `pnpm test` if there's testable logic
- Test with curl or browser dev tools
- Check error handling
