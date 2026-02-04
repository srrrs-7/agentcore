# UI Guidelines Context

## Stack
- Svelte 5 + Vite.
- Tailwind CSS v4 and `bits-ui` for UI utilities.
- Icons via `@lucide/svelte`.

## Layout & Navigation
- `App.svelte` performs client‑side routing with History API.
- Main layout: `apps/web/src/components/layouts`.
- Shared UI components: `apps/web/src/components/ui`.

## Feature Organization
- Feature slices under `apps/web/src/features/<feature>`:
  - `pages`, `components`, `stores`, `api`, `types`, `queries`, `utils`.

## Data Fetching
- Svelte Query client is configured in `src/lib/query/client.ts`.
- Prefer feature‑scoped query keys and typed API functions.

## i18n
- Locales are under `apps/web/src/lib/i18n/locales`.
- Use the `t` helper for user‑facing strings.

## Accessibility
- Use semantic elements and proper label associations.
- Ensure keyboard navigation and visible focus.
- Validate color contrast for all text and interactive elements.
