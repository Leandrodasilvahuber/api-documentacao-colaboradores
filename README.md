# api-documentacao-colaboradores

## Banco de dados (PostgreSQL via Docker Compose)

1. Copie `.env.example` para `.env` e ajuste as credenciais se necessário.
2. Suba o banco: `docker compose up -d`
3. Os dados persistem entre reinicializações no volume `postgres_data` (só é apagado com `docker compose down -v`).

## Prisma

1. Com o banco no ar e o `.env` configurado (`DATABASE_URL`), gere o client: `npm run prisma:generate`.
2. Para criar/aplicar migrações a partir de `prisma/schema.prisma`: `npm run prisma:migrate`.
3. O client gerado fica em `src/generated/prisma` (ignorado pelo git) e é exportado já configurado em `src/lib/prisma.ts`.
