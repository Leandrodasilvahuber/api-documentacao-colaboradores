# api-documentacao-colaboradores

API em Node.js + TypeScript (Express) para documentação de colaboradores.

## Requisitos

- Node.js 22+
- Docker (para o PostgreSQL local)

## Como rodar

1. Copie `.env.example` para `.env` e ajuste as credenciais se necessário.
2. Suba o banco: `docker compose up -d`
3. Instale as dependências: `npm install` (o `postinstall` já roda `prisma generate`)
4. Suba a API em modo desenvolvimento: `npm run dev`

## Scripts

- `npm run dev` — roda `src/server.ts` com `ts-node-dev` (reinicia automaticamente ao alterar arquivos)
- `npm run build` — compila `src/` para `dist/` via `tsc`
- `npm run start` — roda o build compilado (`dist/server.js`), requer `npm run build` antes
- `npm test` — roda os testes com Jest
- `npm run lint` / `npm run lint:fix` — checa/corrige problemas de lint com ESLint
- `npm run format` / `npm run format:check` — formata/checa a formatação com Prettier
- `npm run prisma:generate` — gera o Prisma Client
- `npm run prisma:migrate` — cria/aplica migrações a partir de `prisma/schema.prisma`

## Estrutura de pastas

- `src/app.ts` — configuração do Express (middlewares e rotas)
- `src/server.ts` — sobe o servidor HTTP a partir de `app.ts`
- `src/config` — configuração e validação de variáveis de ambiente (`env.ts`)
- `src/modules` — módulos de domínio da aplicação
- `src/shared` — código compartilhado entre módulos (ex.: `shared/database/prisma.ts`)
- `src/generated/prisma` — client do Prisma gerado automaticamente (ignorado pelo git)

## Banco de dados (PostgreSQL via Docker Compose)

1. Copie `.env.example` para `.env` e ajuste as credenciais se necessário.
2. Suba o banco: `docker compose up -d`
3. Os dados persistem entre reinicializações no volume `postgres_data` (só é apagado com `docker compose down -v`).

## Prisma

1. Com o banco no ar e o `.env` configurado (`DATABASE_URL`), gere o client: `npm run prisma:generate`.
2. Para criar/aplicar migrações a partir de `prisma/schema.prisma`: `npm run prisma:migrate`.
3. O client gerado fica em `src/generated/prisma` (ignorado pelo git) e é exportado já configurado em `src/shared/database/prisma.ts`.
