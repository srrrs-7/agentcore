# Coding Rules

TypeScript coding standards based on Google Style Guide with performance optimizations.

## General Principles
- Prefer simple, readable code over cleverness
- Make data flow explicit; avoid hidden side effects
- Optimize for maintainability first, then performance hotspots
- Small, composable functions with clear contracts

## TypeScript Standards

### Strict Mode (Required)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Safety
```typescript
// BAD: any disables type checking
function parse(data: any) { ... }

// GOOD: unknown requires narrowing
function parse(data: unknown) {
  if (typeof data === "string") { ... }
}

// BAD: Non-null assertion hides bugs
const user = users.find(u => u.id === id)!;

// GOOD: Handle undefined explicitly
const user = users.find(u => u.id === id);
if (!user) throw new NotFoundError();
```

### Explicit Types at Boundaries
```typescript
// Function signatures: explicit return types
export function calculateTotal(items: Item[]): number { ... }

// Module exports: explicit types
export const config: AppConfig = { ... };

// Internal functions: inference is fine
const sum = (a: number, b: number) => a + b;
```

### Discriminated Unions for Error Handling
```typescript
type TaskError =
  | { type: "NOT_FOUND"; id: string }
  | { type: "VALIDATION"; message: string }
  | { type: "DATABASE"; cause: Error };
```

## Naming Conventions

### Files
- **kebab-case** for all files: `user-service.ts`, `task-list.svelte`
- Test files: `*.test.ts`, `*.spec.ts`

### Code
```typescript
// Variables and functions: camelCase
const userName = "john";
function getUserById(id: string) { ... }

// Types, interfaces, classes: PascalCase
type UserId = string;
interface UserProfile { ... }
class UserService { ... }

// Constants: SCREAMING_SNAKE_CASE (optional)
const MAX_RETRY_COUNT = 3;

// Boolean variables: is/has/can prefix
const isActive = true;
const hasPermission = false;
const canEdit = true;
```

## Performance Best Practices

### Avoid Unnecessary Allocations
```typescript
// BAD: Creates new array on every call
function getActiveUsers(users: User[]) {
  return users.filter(u => u.active).map(u => u.name);
}

// GOOD: Single pass with reduce
function getActiveUserNames(users: User[]) {
  return users.reduce<string[]>((acc, u) => {
    if (u.active) acc.push(u.name);
    return acc;
  }, []);
}
```

### Use Appropriate Data Structures
```typescript
// BAD: O(n) lookup
const users: User[] = [...];
const user = users.find(u => u.id === targetId);

// GOOD: O(1) lookup with Map
const usersById = new Map<string, User>();
const user = usersById.get(targetId);
```

### Early Returns and Short-Circuit
```typescript
// GOOD: Exit early to reduce nesting and work
function processUser(user: User | null) {
  if (!user) return null;
  if (!user.active) return null;
  // Main logic here
}
```

### Avoid N+1 Database Access
```typescript
// BAD: N+1 queries
for (const user of users) {
  const orders = await getOrders(user.id);
}

// GOOD: Batch query
const userIds = users.map(u => u.id);
const orders = await getOrdersForUsers(userIds);
```

### Lazy Evaluation
```typescript
// BAD: Compute everything upfront
const allResults = data.map(expensive).filter(valid);
const firstResult = allResults[0];

// GOOD: Short-circuit when possible
const firstResult = data.find(d => {
  const result = expensive(d);
  return valid(result) ? result : undefined;
});
```

### Avoid Memory Leaks
```typescript
// BAD: Event listener leak
element.addEventListener("click", handler);

// GOOD: Cleanup on unmount
const controller = new AbortController();
element.addEventListener("click", handler, { signal: controller.signal });
// Later: controller.abort();
```

## Date/Time Handling

Always use `dayjs` for date manipulation:

```typescript
import dayjs from "dayjs";

// Creation
const now = dayjs();
const fromIso = dayjs("2024-01-15T09:00:00Z");

// Manipulation
const tomorrow = now.add(1, "day");
const startOfMonth = now.startOf("month");

// Comparison
const isOverdue = due.isBefore(now);
const isSameDay = a.isSame(b, "day");

// Formatting
const display = now.format("YYYY-MM-DD HH:mm");
const iso = now.toISOString(); // For API

// NEVER use raw Date
// BAD: new Date(), Date.parse(), Date.now()
```

## Error Handling

### Use neverthrow for Explicit Errors
```typescript
import { ok, err, ResultAsync } from "neverthrow";

// Return Result instead of throwing
function getTask(id: string): ResultAsync<Task, TaskError> {
  return liftAsync(parseId(id))
    .andThen(taskRepository.findById)
    .mapErr(toTaskError);
}

// Handle with .match()
await getTask(id).match(
  (task) => responseOk(c, { task }),
  (error) => {
    switch (error.type) {
      case "NOT_FOUND": return responseNotFound(c);
      case "VALIDATION": return responseBadRequest(c, error.message);
      case "DATABASE": return responseServerError(c);
    }
  }
);
```

### Never Swallow Errors
```typescript
// BAD: Silent failure
try { await riskyOperation(); } catch {}

// GOOD: Log and rethrow or handle
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", { error });
  throw error;
}
```

## Async Patterns

### Prefer async/await
```typescript
// BAD: Nested promises
function fetchData() {
  return fetch(url)
    .then(res => res.json())
    .then(data => process(data));
}

// GOOD: Linear async/await
async function fetchData() {
  const res = await fetch(url);
  const data = await res.json();
  return process(data);
}
```

### Parallel Execution
```typescript
// BAD: Sequential when parallel is possible
const user = await getUser(id);
const orders = await getOrders(id);

// GOOD: Parallel execution
const [user, orders] = await Promise.all([
  getUser(id),
  getOrders(id),
]);
```

### Avoid Async in Loops
```typescript
// BAD: Sequential execution
for (const id of ids) {
  await processItem(id);
}

// GOOD: Parallel with concurrency control
await Promise.all(ids.map(id => processItem(id)));

// Or with limited concurrency
import pLimit from "p-limit";
const limit = pLimit(5);
await Promise.all(ids.map(id => limit(() => processItem(id))));
```

## Code Organization

### Single Responsibility
- One function = one task
- One file = one concept
- Keep functions under 30 lines

### Dependency Direction
```
handlers → services → repositories → domain
    ↓           ↓            ↓           ↓
 (HTTP)    (business)    (data)     (types)
```

### Export Only What's Needed
```typescript
// index.ts - Public API
export { createTask, getTask } from "./service";
export type { Task, TaskId } from "./domain";

// Internal modules - not exported
// ./repository.ts
// ./validator.ts
```

## Formatting & Linting

### Biome Configuration
- Indentation: 2 spaces
- Quotes: double quotes
- Semicolons: required
- Trailing commas: all

### Commands
```bash
bun run format      # Auto-format
bun run check       # Lint + type check
bun run check:type  # Type check only
```

## Comments

### When to Comment
- **Why**, not what (code shows what)
- Complex algorithms
- Non-obvious business rules
- TODO with issue reference

### Comment Style
```typescript
// Single line for brief notes

/**
 * Multi-line for functions with complex behavior.
 * Explains the purpose and any non-obvious details.
 */
function complexOperation() { ... }

// TODO(#123): Refactor when API v2 is released
```

### Avoid Obvious Comments
```typescript
// BAD: Obvious comment
// Increment counter
counter++;

// GOOD: Explains why
// Rate limiting: max 100 requests per minute
counter++;
```
