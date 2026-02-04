# Domain Models Context

## Tasks
- Entity: `Task` (immutable).
  - Fields: `id`, `title`, `description`, `status`, `createdAt`, `updatedAt`.
  - Status: `pending | in_progress | completed`.
- Inputs:
  - `CreateTaskInput`: `title`, optional `description`.
  - `UpdateTaskInput`: optional `title`, `description`, `status`.
- Errors (discriminated union):
  - `NOT_FOUND`, `ALREADY_EXISTS`, `VALIDATION_ERROR`, `DATABASE_ERROR`.

## Stamps
- Entity: `Stamp` (immutable).
  - Fields: `id`, `date`, `clockInAt`, `clockOutAt`, `breakStartAt`, `breakEndAt`, `createdAt`, `updatedAt`.
  - `date` format: `YYYY-MM-DD`.
- Status:
  - `WorkStatus`: `not_working | working | on_break | clocked_out`.
- Actions:
  - `StampType`: `clock_in | clock_out | break_start | break_end`.
- Errors:
  - `STAMP_NOT_FOUND`, `ALREADY_CLOCKED_IN`, `ALREADY_CLOCKED_OUT`,
    `ALREADY_ON_BREAK`, `NOT_CLOCKED_IN`, `NOT_ON_BREAK`, `STILL_ON_BREAK`,
    plus `VALIDATION_ERROR`, `DATABASE_ERROR`.

## Attendance
- Entity: `AttendanceRecord` computed from `Stamp`.
  - Includes derived minutes: `breakMinutes`, `workMinutes`, `overtimeMinutes`,
    `lateNightMinutes`, `statutoryOvertimeMinutes`.
- Summary: `AttendanceSummary` aggregates totals and work days.
- Calculation rules:
  - Standard work day: 8 hours (480 minutes).
  - Late night window: 22:00–05:00.
  - Weekly statutory limit: 40 hours (2400 minutes).
- Errors:
  - `ATTENDANCE_NOT_FOUND`, `INVALID_DATE_RANGE`, plus common errors.

## Files
- Entity: `File` (immutable).
  - Fields: `id`, `fileName`, `contentType`, `fileSize`, `s3Key`, `status`,
    `expiresAt`, `createdAt`, `updatedAt`.
  - Status: `pending | uploaded | failed`.
- Inputs:
  - `CreateFileInput`: `fileName`, `contentType`, `s3Key`, `expiresAt`.
- Errors:
  - `FILE_NOT_FOUND`, `FILE_EXPIRED`, `FILE_ALREADY_COMPLETED`,
    `INVALID_CONTENT_TYPE`, `S3_ERROR`, plus common errors.

## General Rules
- Domain entities are immutable and created via constructors.
- Errors are modeled as discriminated unions.
- Handler‑layer validation uses Zod; domain logic guards invariants.
