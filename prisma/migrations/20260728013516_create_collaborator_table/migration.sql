-- CreateTable
CREATE TABLE "collaborators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Índice único parcial: garante e-mail único apenas entre colaboradores ativos,
-- permitindo reaproveitar o e-mail de um colaborador soft-deletado (deleted_at preenchido).
CREATE UNIQUE INDEX "collaborators_email_key" ON "collaborators"("email") WHERE "deleted_at" IS NULL;
