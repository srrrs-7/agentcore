# Planning Rules

Development workflow centered on Test-Driven Development (TDD) and incremental delivery.

## TDD Cycle (Red-Green-Refactor)

Every feature follows this cycle:

```
┌─────────────────────────────────────────────────────────┐
│  1. RED: Write a failing test                           │
│     ↓                                                   │
│  2. GREEN: Write minimal code to pass                   │
│     ↓                                                   │
│  3. REFACTOR: Improve design, keep tests green          │
│     ↓                                                   │
│  (repeat for next requirement)                          │
└─────────────────────────────────────────────────────────┘
```

### 1. RED Phase
- Write one test that describes expected behavior
- Test must fail (confirms test is valid)
- Focus on the interface, not implementation

### 2. GREEN Phase
- Write the simplest code to make the test pass
- No optimization, no cleanup yet
- "Make it work" is the only goal

### 3. REFACTOR Phase
- Improve code structure without changing behavior
- Remove duplication, improve naming
- All tests must stay green

## When to Plan First

Create a written plan before coding when:
- Adding a new feature under `features/{feature}/`
- Changing architecture, dependencies, or data models
- Refactoring across multiple files or layers
- Modifying infrastructure, build pipelines, or schemas
- Estimated work exceeds 2 hours

## Planning Process

### Step 1: Define Requirements
- What is the user trying to accomplish?
- What are the acceptance criteria?
- What are the edge cases?

### Step 2: Design Tests First
```
Given [initial state]
When [action occurs]
Then [expected outcome]
```

### Step 3: Identify Changes
- List all files to create/modify
- Note dependencies and order
- Identify risks and unknowns

### Step 4: Break Into Tasks
- Each task should be completable in < 30 minutes
- Each task should have a test
- Tasks should be independently verifiable
- Always add a post-implementation refactor task to revisit and improve the code after it works

## Deliverables

### Plan Document
```markdown
## Feature: [Name]

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Test Cases
1. Happy path: ...
2. Edge case: ...
3. Error case: ...

### Implementation Steps
1. [ ] Write test for X
2. [ ] Implement X
3. [ ] Write test for Y
4. [ ] Implement Y

### Risks
- Risk 1: Mitigation...
```

### Commit Strategy
- One commit per TDD cycle (test + implementation)
- Commit message: `feat(scope): description`
- Each commit should pass all tests

## Anti-Patterns to Avoid

### Planning Anti-Patterns
- Writing code before tests
- Planning too far ahead (YAGNI)
- Skipping the refactor phase
- Large batch commits

### TDD Anti-Patterns
- Testing implementation details
- Writing multiple tests before any implementation
- Skipping failing test confirmation
- Over-mocking (test behavior, not mocks)

## Incremental Delivery

### Vertical Slices
- Implement end-to-end for one use case
- Avoid horizontal layers (all models, then all services)
- Each slice should be deployable

### Feature Flags
- Hide incomplete features behind flags
- Enable gradual rollout
- Quick rollback capability

## Example: New API Endpoint

```markdown
## Feature: DELETE /api/tasks/:id

### Test Cases
1. 204: Successfully deletes existing task
2. 404: Task not found
3. 401: Unauthorized request

### Implementation Steps
1. [ ] Write 204 test case
2. [ ] Implement handler + service
3. [ ] Write 404 test case
4. [ ] Add not-found handling
5. [ ] Write 401 test case
6. [ ] Add auth middleware
7. [ ] Refactor: extract common patterns
```
