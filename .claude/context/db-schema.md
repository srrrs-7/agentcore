# Database Context

## ORM
- Prisma is used for database access.
- Schema file: `apps/api/src/lib/db/prisma/schema.prisma`.
- Client output: `apps/api/src/lib/db/generated/client`.
- Fabbrica output: `apps/api/src/lib/db/generated/fabbrica`.

## Models (PostgreSQL)

### Task
- Table: `tasks` (mapped via `@@map`).
- Columns:
  - `id` UUID (PK)
  - `title` (string)
  - `description` (nullable string)
  - `status` (enum: `pending | in_progress | completed`)
  - `createdAt`, `updatedAt` timestamps

### Stamp
- Table: `stamps`.
- Columns:
  - `id` UUID (PK)
  - `date` string (YYYY-MM-DD)
  - `clockInAt`, `clockOutAt`, `breakStartAt`, `breakEndAt`
  - `createdAt`, `updatedAt`
- Constraints:
  - Unique on `date`.

### File
- Table: `files`.
- Columns:
  - `id` UUID (PK)
  - `fileName`, `contentType`, `s3Key`
  - `fileSize` (nullable int)
  - `status` (enum: `pending | uploaded | failed`)
  - `expiresAt`, `createdAt`, `updatedAt`
- Indexes:
  - `status`, `expiresAt`.
- `s3Key` is unique.

## Migration & Generation
- Use root scripts:
  - `bun run db:generate`
  - `bun run db:migrate:dev`
  - `bun run db:migrate:deploy`
  - `bun run db:migrate:reset`
