# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js routes, including API endpoints under `src/app/api/` and UI pages (e.g., `src/app/page.tsx`).
- `src/components/` contains UI components; dictation UI lives in `src/components/dictation/`.
- `src/hooks/` includes core client logic such as `src/hooks/use-voice-dictation.ts`.
- `src/lib/` contains shared logic (STT providers, auth, encryption, schema, pricing).
- `public/` stores static assets like PWA icons.
- `drizzle/` and `drizzle.config.ts` define database schema and migrations.
- `scripts/` holds setup utilities (see `scripts/setup.ts`).

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `cp .env.example .env` then set `POSTGRES_URL` and `BETTER_AUTH_SECRET`.
- `npm run dev` starts the Next.js dev server.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript checks.
- `npm run build` builds for production (runs migrations first).
- `npm run db:migrate` applies Drizzle migrations.

## Coding Style & Naming Conventions
- Formatting is enforced by Prettier (`.prettierrc`): 2-space indent, semicolons, double quotes, 100-char line width.
- ESLint is configured in `eslint.config.mjs` and should be clean before PRs.
- TypeScript + React conventions apply; file names are mostly kebab-case (e.g., `use-voice-dictation.ts`).

## Testing Guidelines
- There is no automated test framework or test directory currently.
- Run `npm run lint && npm run typecheck` as the baseline verification after changes.
- If you add tests, keep them colocated with the feature or under a dedicated `tests/` directory and document how to run them.

## Commit & Pull Request Guidelines
- Commit history shows Conventional Commit-style prefixes like `feat:`, `chore:`, and `debug:`. Follow that pattern when possible; concise, imperative subjects are preferred.
- PRs should include a short summary, relevant screenshots for UI changes, and any environment or migration notes (e.g., `db:migrate`).

## Security & Configuration Notes
- Secrets live in `.env` and should not be committed.
- STT provider API keys are user-provided via Settings and are encrypted server-side; avoid introducing server environment variables for provider keys.
