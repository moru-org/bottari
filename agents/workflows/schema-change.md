# Workflow: Schema Change

## Purpose
Safely modify the Prisma schema and propagate changes.

## Steps

### 1. Edit Schema
Edit `prisma/schema.prisma`.

### 2. Generate Client
```bash
pnpm db:generate
```

### 3. Push to Dev DB
```bash
pnpm db:push
```

### 4. Update Code
- Update TypeScript types in `lib/`
- Update API routes that use affected models
- Update any seed/migration data if needed

### 5. Update Docs
- Update `agents/backend.md` data model section
- Update `agents/bottari.md` data model section if public-facing

### 6. Verify
```bash
pnpm db:studio  # Verify data in GUI
pnpm test       # Run tests
```
