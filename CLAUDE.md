# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a Node.js + TypeScript project (`api-documentacao-colaboradores`) using Express, backed by PostgreSQL via Prisma. `src/app.ts` configures the Express app (middlewares and routes); `src/server.ts` starts the HTTP server from it.

The `collaborator` module (`src/modules/collaborator`) implements full CRUD over `/collaborators`, with soft delete (`deletedAt`) and paginated listing. It's the reference pattern for any new domain module: `*.schema.ts` (zod validation) → `*.repository.ts` (Prisma access) → `*.service.ts` (business rules, throws `AppError`) → `*.controller.ts` (HTTP glue, delegates to the service) → `*.routes.ts` (wires the controller into an Express `Router`), registered in `src/app.ts`.

Beyond `collaborator`, the domain has four more modules, all registered in `src/app.ts`:

- `document-type` (`src/modules/document-type`) — CRUD over `/document-types`, same pattern as `collaborator` (soft delete, partial unique index on `name`, paginated listing).
- `collaborator-document` (`src/modules/collaborator-document`) — `/collaborators/:collaboratorId/documents`, links/unlinks `DocumentType`s to a `Collaborator` (`CollaboratorDocumentType`). Re-linking a soft-deleted link reactivates it instead of erroring; linking an already-active one is a silent no-op.
- `submission` (`src/modules/submission`) — `/collaborators/:collaboratorId/documents/:documentTypeId/submissions` (submit a new document version + list version history) and `/documents/pending` (paginated, filterable list of links still awaiting submission). Submitting runs in a Prisma transaction that deactivates the current version and creates the next one; a unique index on `(collaboratorDocumentTypeId, version)` turns concurrent submits into a 409 (`Prisma.PrismaClientKnownRequestError` code `P2002`) instead of corrupting version history.
- `statistics` (`src/modules/statistics`) — `/statistics/completion`, `/statistics/pending-ranking`, `/statistics/recent-submissions` — read-only aggregates: completion percentage, pending ranking by document type (ties broken alphabetically), and recent submissions. No schema/repository writes — pure read-side aggregation over the other modules' tables.

Swagger/OpenAPI docs are generated from `@openapi` JSDoc blocks in each `*.routes.ts` file, assembled by `swagger-jsdoc` in `src/config/swagger.ts`, and served at `/docs` via `swagger-ui-express` (mounted in `src/app.ts`).

Structured logging uses `pino` + `pino-http` (`src/shared/logger`), wired as request-logging middleware in `src/app.ts`; log level is controlled by `LOG_LEVEL` (validated in `src/config/env.ts`), and in non-production `NODE_ENV` it pipes through `pino-pretty`.

Server port comes from `process.env.PORT`, defaulting to `3000`. Environment variables are validated at boot via zod in `src/config/env.ts` (`NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`); it throws if invalid.

## Commands

- `npm run build` — compile TypeScript (`src/`) to JavaScript (`dist/`) via `tsc`
- `npm run dev` — run `src/server.ts` directly with `tsx watch` (auto-restarts on file changes)
- `npm run start` — run the compiled output at `dist/server.js` (requires `npm run build` first)
- `npm test` — run Jest (`jest --passWithNoTests`)
- `npm run lint` / `npm run lint:fix` — check/fix lint issues with ESLint
- `npm run format` / `npm run format:check` — format/check formatting with Prettier
- `npm run prisma:generate` — generate the Prisma Client (also runs automatically via `postinstall`)
- `npm run prisma:migrate` — create/apply migrations from `prisma/schema.prisma`

## Database (PostgreSQL via Docker Compose)

- `docker-compose.yml` provisions a local `postgres` service (`db`) and `pgAdmin`. Copy `.env.example` to `.env`, then `docker compose up -d`.
- `DATABASE_URL` in `.env` points at the local Postgres container by default.
- The Prisma Client is generated to `src/generated/prisma` (gitignored) and exported pre-configured from `src/shared/database/prisma.ts` using `@prisma/adapter-pg`.
- Migrations live in `prisma/migrations/`. Both `collaborators.email` and `document_types.name` uniqueness are enforced by a **partial unique index** (`WHERE deleted_at IS NULL`), not a plain `@unique` in the Prisma schema — this lets a soft-deleted collaborator's email (or document type's name) be reused. Keep this in mind if the schema is ever regenerated from the DB or the constraint is touched again.
- Soft-deleting a `Collaborator` or `DocumentType` cascades a soft delete to its `CollaboratorDocumentType` links (see `9367b9a`/`928b00c` in history) — don't assume deleting the parent leaves orphaned active links.

## API testing collection

`bruno/` holds a native Bruno collection (`.bru` files) covering all endpoints across every module (`Collaborators`, `DocumentTypes`, `CollaboratorDocuments`, `Submissions`, `Statistics`), including success and error cases (409/400/404) and pagination. Use the `Local` environment (`baseUrl`). Bruno's scripting API (`res.getStatus()`, `res.getBody()`, `bru.setVar()`) is not the same as Postman's `pm.*` — don't mix them when editing `.bru` files.

## TypeScript configuration notes

- `tsconfig.json` uses `module`/`moduleResolution: nodenext` and targets `es2020`, with `rootDir: src` / `outDir: dist`, plus `isolatedModules: true` (required for ts-jest under `nodenext`).
- Strict mode is on, plus extra strictness flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`.
- The pinned TypeScript version is `^5.9.3`, not the TS 7 native-preview line — `tsx` is not yet compatible with TypeScript 7, so do not upgrade past the 5.x line without verifying tooling compatibility first.

## Testing notes

- Jest + ts-jest, config in `jest.config.js`. `testPathIgnorePatterns` excludes `dist/` — without it, `tsc`-compiled copies of test files under `dist/` get picked up and run a second time (and fail, since `jest.mock` doesn't work outside the ts-jest transform).
- `moduleNameMapper` strips `.js` from relative imports, since the generated Prisma client uses NodeNext-style `.js` specifiers that Jest's CJS resolver can't follow otherwise.
- Unit tests live next to the module in `__tests__/` (e.g. `src/modules/collaborator/__tests__/collaborator.service.test.ts`), mocking the repository layer with `jest.mock(...)`.

## Lint notes

- `@typescript-eslint/no-unused-vars` is configured with `argsIgnorePattern`/`varsIgnorePattern: "^_"` — prefix intentionally-unused parameters (e.g. Express error-handler middlewares, which require a 4-arg signature) with `_`.

## Commit message convention

All commits must follow Conventional Commits: `<type>: <description>` in Portuguese, description in lowercase, no period at the end.

Types:

- `feat:` nova funcionalidade — ex: `feat: adiciona login via Google`
- `fix:` correção de bug — ex: `fix: corrige cálculo de frete grátis`
- `docs:` mudanças na documentação — ex: `docs: atualiza README com instruções de deploy`
- `refactor:` mudança de código que não corrige bug nem adiciona feature — ex: `refactor: extrai lógica de validação para helper`
- `test:` adiciona ou corrige testes — ex: `test: adiciona testes para serviço de pagamento`
- `chore:` tarefas de manutenção (dependências, configs) — ex: `chore: atualiza dependências`
- `style:` formatação, sem mudança de lógica — ex: `style: ajusta formatação com prettier`
- `perf:` melhoria de performance — ex: `perf: otimiza query de listagem de produtos`

Não inclua o trailer `Co-Authored-By: Claude` (ou qualquer coautoria) nas mensagens de commit.
