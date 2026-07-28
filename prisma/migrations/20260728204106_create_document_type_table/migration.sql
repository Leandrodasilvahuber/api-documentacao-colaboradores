-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Índice único parcial: garante nome único apenas entre tipos de documento ativos,
-- permitindo reaproveitar o nome de um tipo soft-deletado (deleted_at preenchido).
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name") WHERE "deleted_at" IS NULL;
