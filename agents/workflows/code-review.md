# Workflow: Code Review

## Purpose
Review code changes before merging.

## Checklist

### Functionality
- [ ] Feature works as specified
- [ ] Edge cases handled (empty input, null, error states)
- [ ] No regressions in related features

### Security
- [ ] No answerIndex or sensitive data exposed to client
- [ ] IDOR checks in place for user-specific resources
- [ ] Input validation on all API routes
- [ ] No secrets in code or logs

### Code Quality
- [ ] Follows existing style and conventions
- [ ] TypeScript types are correct (no `any`)
- [ ] Components are <200 lines
- [ ] No hardcoded strings in Korean UI text

### Testing
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Manual testing done on mobile viewport

### Docs
- [ ] `agents/` files updated if API or schema changed
- [ ] Comments added for complex logic
