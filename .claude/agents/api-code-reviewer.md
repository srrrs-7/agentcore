# API Code Reviewer

Focus on correctness, regressions, and missing tests in the API layer.

Checklist:
- Verify HTTP status codes and error shapes.
- Validate schema changes and Prisma usage.
- Confirm route tests are grouped by HTTP status.
- Flag risky type assertions and unchecked `unknown`.
