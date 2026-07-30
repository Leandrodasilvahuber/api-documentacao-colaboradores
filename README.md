# api-documentacao-colaboradores

API em Node.js + TypeScript (Express) para controle de documentos de colaboradores: cadastro de
colaboradores, tipos de documento, vínculo entre eles, envio/histórico de versões de documentos e
estatísticas de completude.

## Visão geral

O domínio da API gira em torno de quatro entidades:

- **Collaborator** — colaborador cadastrado (nome, email). Suporta soft delete (`deletedAt`).
- **DocumentType** — tipo de documento que pode ser exigido de um colaborador (ex.: RG, CPF).
  Também suporta soft delete.
- **CollaboratorDocumentType** — vínculo entre um colaborador e um tipo de documento (indica que
  aquele colaborador precisa enviar aquele documento). Um colaborador pode ter vários tipos de
  documento vinculados, e um vínculo pode ser desfeito (soft delete) e reativado depois.
- **DocumentSubmission** — cada envio de um documento gera uma nova versão vinculada ao
  `CollaboratorDocumentType`; a versão anterior é marcada como não-atual (`isCurrentVersion`),
  preservando o histórico completo.

Módulos da aplicação (`src/modules`):

| Módulo | Rotas base | Responsabilidade |
| --- | --- | --- |
| `collaborator` | `/collaborators` | CRUD de colaboradores, com soft delete e listagem paginada |
| `document-type` | `/document-types` | CRUD de tipos de documento, com soft delete e listagem paginada |
| `collaborator-document` | `/collaborators/:collaboratorId/documents` | Vincula/desvincula tipos de documento a um colaborador |
| `submission` | `/collaborators/:collaboratorId/documents/:documentTypeId/submissions`, `/documents/pending` | Envio de novas versões de documento, histórico e listagem paginada de pendências |
| `statistics` | `/statistics` | Percentual de completude, ranking de pendências por tipo de documento e envios recentes |

Documentação interativa (Swagger/OpenAPI) fica disponível em `/docs` quando a API está rodando,
gerada a partir dos comentários `@openapi` em cada arquivo `*.routes.ts` (ver `src/config/swagger.ts`).

## Decisões técnicas

- **Arquitetura em camadas por módulo**: `*.schema.ts` (validação com zod) → `*.repository.ts`
  (acesso ao Prisma) → `*.service.ts` (regras de negócio, lança `AppError`) → `*.controller.ts`
  (glue HTTP) → `*.routes.ts` (Express `Router`), registrado em `src/app.ts`. O módulo
  `collaborator` é o padrão de referência para qualquer módulo novo.
- **Soft delete em vez de exclusão física**: `Collaborator`, `DocumentType` e
  `CollaboratorDocumentType` usam `deletedAt` para permitir reativação e preservar histórico
  (ex.: reativar um vínculo removido em vez de recriar). A remoção de um colaborador ou tipo de
  documento propaga soft delete em cascata para os vínculos associados.
- **Unicidade parcial via índice no banco**: `collaborators.email` e `document_types.name` têm
  unicidade garantida por índice único parcial (`WHERE deleted_at IS NULL`), criado à mão na
  migration correspondente — não representável em `@unique`/`@@unique` do Prisma Schema Language.
  Isso permite reaproveitar o email/nome de um registro soft-deletado. Violações de unicidade
  concorrente (`P2002`) são tratadas na camada de serviço e convertidas em erro 409.
- **Versionamento de documentos com controle de concorrência**: cada envio roda em uma transação
  Prisma que desativa a versão atual e cria a nova; um índice único em
  `(collaboratorDocumentTypeId, version)` garante que envios concorrentes para o mesmo vínculo não
  gerem versões duplicadas — o conflito vira um 409 ("Envio concorrente detectado, tente
  novamente") em vez de dado inconsistente.
- **Erros de domínio tipados**: `AppError` (com `statusCode`) é lançado pelos serviços e traduzido
  para respostas HTTP pelo middleware `errorHandler`; erros de validação `zod` (`ZodError`) viram
  400 com o detalhamento das issues automaticamente.
- **Logging estruturado**: `pino` + `pino-http` registram cada requisição; em desenvolvimento o
  transporte usa `pino-pretty` para saída legível, controlado por `LOG_LEVEL`.
- **Documentação OpenAPI via JSDoc**: cada rota tem um bloco `@openapi` descrevendo parâmetros,
  request body e respostas; `swagger-jsdoc` monta o spec e `swagger-ui-express` o expõe em `/docs`.
- **Validação de ambiente no boot**: `src/config/env.ts` valida `NODE_ENV`, `PORT`, `DATABASE_URL`
  e `LOG_LEVEL` com zod e lança erro imediatamente se algo estiver inválido, evitando falhas
  silenciosas em runtime.

## Requisitos

- Node.js 22+
- Docker (para o PostgreSQL local)

## Setup

1. **Variáveis de ambiente**: copie `.env.example` para `.env` e ajuste as credenciais se
   necessário (`DATABASE_URL`, portas, credenciais do Postgres/pgAdmin, `LOG_LEVEL`).

   ```bash
   cp .env.example .env
   ```

2. **Banco de dados (Docker Compose)**: suba o Postgres (e o pgAdmin) local:

   ```bash
   docker compose up -d
   ```

   Os dados persistem no volume `postgres_data` entre reinicializações (só são apagados com
   `docker compose down -v`).

3. **Dependências**: instale os pacotes — o hook `postinstall` já roda `prisma generate`:

   ```bash
   npm install
   ```

4. **Migrations**: aplique as migrações existentes em `prisma/migrations/` no banco:

   ```bash
   npm run prisma:migrate
   ```

   Use este comando também sempre que alterar `prisma/schema.prisma` — ele cria uma nova migration
   e a aplica localmente. Para apenas gerar o client sem migrar, use `npm run prisma:generate`.

5. **Subir a API**:

   ```bash
   npm run dev
   ```

   A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`), com reinício automático
   via `tsx watch`. A documentação interativa fica em `http://localhost:3000/docs`.

6. **Rodar os testes**:

   ```bash
   npm test
   ```

   Os testes (Jest + ts-jest) ficam em `__tests__/` ao lado de cada módulo e mockam a camada de
   repository — não dependem do banco estar no ar.

## Scripts

- `npm run dev` — roda `src/server.ts` com `tsx watch` (reinicia automaticamente ao alterar arquivos)
- `npm run build` — compila `src/` para `dist/` via `tsc`
- `npm run start` — roda o build compilado (`dist/server.js`), requer `npm run build` antes
- `npm test` — roda os testes com Jest
- `npm run lint` / `npm run lint:fix` — checa/corrige problemas de lint com ESLint
- `npm run format` / `npm run format:check` — formata/checa a formatação com Prettier
- `npm run prisma:generate` — gera o Prisma Client
- `npm run prisma:migrate` — cria/aplica migrações a partir de `prisma/schema.prisma`

## Estrutura de pastas

- `src/app.ts` — configuração do Express (middlewares, rotas e `/docs`)
- `src/server.ts` — sobe o servidor HTTP a partir de `app.ts`
- `src/config` — validação de variáveis de ambiente (`env.ts`) e spec do Swagger (`swagger.ts`)
- `src/modules` — módulos de domínio da aplicação (`collaborator`, `document-type`,
  `collaborator-document`, `submission`, `statistics`), cada um com schema, repository, service,
  controller, routes e testes em `__tests__/`
- `src/shared` — código compartilhado: `shared/database/prisma.ts` (client Prisma configurado),
  `shared/errors/AppError.ts`, `shared/middlewares/errorHandler.ts`, `shared/logger`,
  `shared/utils` (paginação)
- `src/generated/prisma` — client do Prisma gerado automaticamente (ignorado pelo git)
- `prisma/migrations` — migrações SQL versionadas
- `bruno/` — coleção Bruno com requests cobrindo sucesso e erro (400/404/409) de todos os endpoints

## Banco de dados (PostgreSQL via Docker Compose)

1. Copie `.env.example` para `.env` e ajuste as credenciais se necessário.
2. Suba o banco: `docker compose up -d`
3. Os dados persistem entre reinicializações no volume `postgres_data` (só é apagado com
   `docker compose down -v`).
4. A `collaborators.email` e a `document_types.name` têm unicidade garantida por índice único
   parcial (`WHERE deleted_at IS NULL`) criado à mão nas migrations — ver seção de decisões
   técnicas.

## pgAdmin

1. `docker compose up -d` também sobe o pgAdmin junto com o banco.
2. Acesse `http://localhost:5050` (ou a porta definida em `PGADMIN_PORT`).
3. Faça login com `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` (definidos no `.env`).
4. O servidor "api-documentacao-colaboradores" já aparece na árvore lateral, apontando para o
   serviço `db`; ao expandi-lo pela primeira vez, informe a senha do Postgres
   (`POSTGRES_PASSWORD`, default `postgres`) — pode marcar "Save Password" para não digitar de novo.

## Prisma

1. Com o banco no ar e o `.env` configurado (`DATABASE_URL`), gere o client: `npm run prisma:generate`.
2. Para criar/aplicar migrações a partir de `prisma/schema.prisma`: `npm run prisma:migrate`.
3. O client gerado fica em `src/generated/prisma` (ignorado pelo git) e é exportado já configurado
   em `src/shared/database/prisma.ts`, usando `@prisma/adapter-pg`.

## Testando a API

- **Bruno**: a coleção em `bruno/` cobre todos os endpoints (sucesso e erros 400/404/409,
  paginação, filtros). Use o ambiente `Local` (`baseUrl`).
- **Swagger UI**: com a API rodando, acesse `/docs` para explorar e testar os endpoints
  interativamente, com os schemas de request/response documentados.
