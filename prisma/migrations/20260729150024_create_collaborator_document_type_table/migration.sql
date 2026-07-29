-- CreateTable
CREATE TABLE "collaborator_document_types" (
    "id" TEXT NOT NULL,
    "collaborator_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "collaborator_document_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaborator_document_types_collaborator_id_document_type_i_key" ON "collaborator_document_types"("collaborator_id", "document_type_id");

-- AddForeignKey
ALTER TABLE "collaborator_document_types" ADD CONSTRAINT "collaborator_document_types_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "collaborators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_document_types" ADD CONSTRAINT "collaborator_document_types_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
