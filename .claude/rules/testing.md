# Testing Rules

Testing strategy based on Google Testing Blog best practices and the Testing Trophy.

## Testing Philosophy

### Write Tests That Give Confidence
- Tests should catch bugs that would reach production
- Tests should not break when implementation changes
- Tests should be fast enough to run frequently

### Test Behavior, Not Implementation
```typescript
// BAD: Testing implementation
expect(service['privateMethod']).toHaveBeenCalled();

// GOOD: Testing behavior
expect(result.status).toBe("completed");
```

## Test Pyramid

```
        /\
       /  \      E2E (Few)
      /----\     - Critical user journeys
     /      \    - Smoke tests
    /--------\   Integration (Some)
   /          \  - API endpoints
  /------------\ - Database queries
 /              \
/----------------\ Unit (Many)
                   - Pure functions
                   - Domain logic
```

### Coverage Targets
- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: Core user flows only

## Test Characteristics (F.I.R.S.T.)

- **Fast**: Unit tests < 10ms, integration < 100ms
- **Isolated**: No shared state between tests
- **Repeatable**: Same result every time
- **Self-validating**: Pass/fail without manual inspection
- **Timely**: Written before or with the code

## TDD Flow

1. **Red**: Write a failing test that describes the behavior
2. **Green**: Implement the smallest change to pass
3. **Refactor**: Improve clarity/performance while keeping tests green

## API Testing (Vitest + Prisma Fabbrica)

### File Structure
```
features/{feature}/
├── service/
│   └── service.test.ts      # Unit tests for business logic
└── .test/
    ├── setup.ts             # Test fixtures and helpers
    └── handler.*.test.ts    # Integration tests by HTTP method
```

### Test Case Pattern
Group by HTTP status, nest cases under each status:

```typescript
describe.sequential("POST /api/tasks", () => {
  const cases = [
    {
      name: "creates task with valid input",
      expectedStatus: 201,
      setup: async () => ({ body: { title: "Test" } }),
      execute: async (ctx) => app.request("/api/tasks", {
        method: "POST",
        body: JSON.stringify(ctx.body),
        headers: { "Content-Type": "application/json" },
      }),
      assert: async (res) => {
        const json = await res.json();
        expect(json.task.title).toBe("Test");
      },
    },
    {
      name: "returns 400 for missing title",
      expectedStatus: 400,
      execute: async () => app.request("/api/tasks", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      assert: async (res) => {
        const json = await res.json();
        expect(json.error).toContain("title");
      },
    },
  ] as const;

  // Group by status code
  const byStatus = new Map<number, typeof cases[number][]>();
  for (const tc of cases) {
    const list = byStatus.get(tc.expectedStatus) ?? [];
    byStatus.set(tc.expectedStatus, [...list, tc]);
  }

  for (const [status, group] of byStatus) {
    describe(`HTTP ${status}`, () => {
      for (const tc of group) {
        it(tc.name, async () => {
          const ctx = await tc.setup?.();
          const res = await tc.execute(ctx);
          expect(res.status).toBe(status);
          await tc.assert?.(res, ctx);
        });
      }
    });
  }
});
```

### Prisma Fabbrica Usage
```typescript
import { defineTaskFactory } from "@api/lib/db/__generated__/fabbrica";

const TaskFactory = defineTaskFactory();

// Create test data
const task = await TaskFactory.create({ title: "Test Task" });

// Create with associations
const task = await TaskFactory.create({
  user: { create: { email: "test@example.com" } },
});
```

## Unit Testing Best Practices

### Arrange-Act-Assert Pattern
```typescript
it("calculates total with tax", () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(330);
});
```

### Test Edge Cases
- Empty inputs
- Boundary values
- Null/undefined
- Error conditions
- Concurrent access

### Avoid Test Smells
- **Flaky tests**: Fix or delete them
- **Slow tests**: Mock external dependencies
- **Brittle tests**: Test behavior, not structure
- **Mystery guests**: Make test data explicit

## Mocking Guidelines

### When to Mock
- External APIs
- Database (for unit tests only)
- Time/dates
- Random values

### When NOT to Mock
- The system under test
- Simple value objects
- In integration tests (use real DB)

### Vitest Mocking
```typescript
import { vi } from "vitest";

// Mock module
vi.mock("@api/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock time
vi.useFakeTimers();
vi.setSystemTime(new Date("2024-01-15"));

// Restore
afterEach(() => {
  vi.restoreAllMocks();
});
```

## Database Testing

### Use Transactions for Isolation
```typescript
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

### Reset Between Tests
```typescript
import { resetDatabase } from "@api/lib/db/test-utils";

beforeEach(async () => {
  await resetDatabase();
});
```

## Assertions Best Practices

### Be Specific
```typescript
// BAD: Too vague
expect(result).toBeTruthy();

// GOOD: Specific assertion
expect(result.status).toBe("completed");
expect(result.items).toHaveLength(3);
```

### Use Custom Matchers
```typescript
expect.extend({
  toBeValidTask(received) {
    const pass = received.id && received.title && received.createdAt;
    return {
      pass,
      message: () => `expected ${received} to be a valid task`,
    };
  },
});
```

## Test Design Checklist
- Each test has a single, clear reason to fail
- Use realistic data; avoid mocking unless needed for isolation
- Avoid shared mutable state; use setup/teardown helpers
- Keep assertions focused; assert on outputs and side-effects only

## Pre-Commit Requirements

Before pushing:
```bash
bun run test:run       # All tests pass
bun run test:coverage  # Coverage meets threshold
bun run check          # Lint + type check
```

## Debugging Failed Tests

1. Run single test: `bun test path/to/test.ts -t "test name"`
2. Add `.only` to focus: `it.only("test name", ...)`
3. Use `console.log` or debugger
4. Check test isolation (run alone vs. in suite)
