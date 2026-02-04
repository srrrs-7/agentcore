# Release & Deploy Context

## Build & Checks
- Run `bun run check` before release or PR.
- Build outputs:
  - API: `bun run build:api`
  - Web: `bun run build:web`

## Database
- Schema changes require Prisma migrations.
- Use `bun run db:migrate:deploy` for production deployments.

## Infrastructure (IaC)
- Terraform in `apps/iac`.
- Treat `apps/iac/envs/*` changes as production‑impacting.
- Call out infra changes explicitly in PRs.

## Operational Notes
- Ensure auth configuration is correct for production (Cognito).
- Verify `VITE_API_URL` points to the correct API base.
