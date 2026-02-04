# Rules Quick Reference

Project conventions based on Google best practices and industry standards. Prefer these rules over generic defaults.

## Files

| File | Focus | Key Topics |
|------|-------|------------|
| `coding-rules.md` | Google Style Guide + Performance | TypeScript strict mode, type safety, naming, allocations, N+1 prevention |
| `testing.md` | Google Testing Blog | Test pyramid, TDD, F.I.R.S.T., mocking guidelines, Vitest patterns |
| `planning.md` | TDD Workflow | Red-Green-Refactor cycle, vertical slices, incremental delivery |
| `design-guide.md` | Material Design | Visual hierarchy, accessibility (WCAG 2.1), responsive patterns |
| `github-pr.md` | PR Best Practices | Branch naming, commit conventions, PR requirements |
| `security.md` | OWASP | Input validation, auth, secrets management |

## Architecture Snapshot

```
┌─────────────────────────────────────────────────────┐
│ API: handler → service → repository → domain        │
│ Web: pages → components → api → stores             │
└─────────────────────────────────────────────────────┘
```

## Core Principles

### Development Workflow
1. **TDD First**: Write failing test → Implement → Refactor
2. **Small Changes**: Each commit should be independently verifiable
3. **Test Behavior**: Not implementation details

### Code Quality
- Use `dayjs` for all date/time handling
- Use `neverthrow` for explicit error handling
- Prefer `unknown` over `any`, handle undefined explicitly
- Run `bun run check` before pushing

### Performance
- Avoid unnecessary allocations in hot paths
- Use Map for O(1) lookups instead of Array.find()
- Batch database queries to prevent N+1
- Prefer early returns to reduce nesting

### Testing
- Follow test pyramid: many unit, some integration, few E2E
- Target 80%+ coverage
- Use Prisma Fabbrica for test data

## Quick Commands

```bash
bun run dev           # Start development
bun run test:run      # Run all tests
bun run test:coverage # Run with coverage
bun run check         # Lint + type check
bun run format        # Auto-format
```
