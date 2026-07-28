# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a Node.js + TypeScript project (`api-documentacao-colaboradores`) using Express. `src/index.ts` sets up the Express app and starts the HTTP server; no routes beyond `GET /` have been added yet. Jest (with ts-jest) is configured as the test runner, but no test files exist yet.

Server port comes from `process.env.PORT`, defaulting to `3000`.

## Commands

- `npm run build` — compile TypeScript (`src/`) to JavaScript (`dist/`) via `tsc`
- `npm run dev` — run `src/index.ts` directly with `ts-node-dev` (auto-restarts on file changes, transpile-only)
- `npm run start` — run the compiled output at `dist/index.js` (requires `npm run build` first)

- `npm test` — run Jest (`jest --passWithNoTests`, so it doesn't fail while no test files exist yet)

There is no lint command configured yet.

## TypeScript configuration notes

- `tsconfig.json` uses `module`/`moduleResolution: nodenext` and targets `es2020`, with `rootDir: src` / `outDir: dist`.
- Strict mode is on, plus extra strictness flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`.
- The pinned TypeScript version is `^5.9.3`, not the TS 7 native-preview line — `ts-node-dev`/`ts-node` are not yet compatible with TypeScript 7, so do not upgrade past the 5.x line without verifying tooling compatibility first.

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
