import { prisma } from "../../src/shared/database/prisma";

export async function resetDatabase(): Promise<void> {
  await prisma.documentSubmission.deleteMany();
  await prisma.collaboratorDocumentType.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.collaborator.deleteMany();
}
