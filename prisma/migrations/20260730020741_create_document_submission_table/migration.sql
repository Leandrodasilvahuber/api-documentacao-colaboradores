-- CreateTable
CREATE TABLE "document_submissions" (
    "id" TEXT NOT NULL,
    "collaborator_document_type_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "is_current_version" BOOLEAN NOT NULL DEFAULT true,
    "file_name" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_submissions_collaborator_document_type_id_version_key" ON "document_submissions"("collaborator_document_type_id", "version");

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_collaborator_document_type_id_fkey" FOREIGN KEY ("collaborator_document_type_id") REFERENCES "collaborator_document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
