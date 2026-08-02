-- CreateIndex
-- Índices parciais para acelerar buscas por registros ativos (deleted_at IS NULL),
-- que é o filtro presente em praticamente toda leitura das tabelas.
CREATE INDEX "collaborators_active_idx" ON "collaborators"("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "document_types_active_idx" ON "document_types"("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "collaborator_document_types_active_idx" ON "collaborator_document_types"("collaborator_id", "document_type_id") WHERE "deleted_at" IS NULL;
