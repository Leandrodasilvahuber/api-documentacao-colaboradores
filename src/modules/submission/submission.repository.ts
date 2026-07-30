import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../generated/prisma/client";

type Client = Prisma.TransactionClient | typeof prisma;

export const submissionRepository = {
  findCurrentVersion(collaboratorDocumentTypeId: string) {
    return prisma.documentSubmission.findFirst({
      where: { collaboratorDocumentTypeId, isCurrentVersion: true },
    });
  },

  findLatestVersion(collaboratorDocumentTypeId: string) {
    return prisma.documentSubmission.findFirst({
      where: { collaboratorDocumentTypeId },
      orderBy: { version: "desc" },
    });
  },

  deactivateCurrentVersion(collaboratorDocumentTypeId: string, client: Client = prisma) {
    return client.documentSubmission.updateMany({
      where: { collaboratorDocumentTypeId, isCurrentVersion: true },
      data: { isCurrentVersion: false },
    });
  },

  create(
    data: { collaboratorDocumentTypeId: string; version: number; fileName?: string },
    client: Client = prisma,
  ) {
    return client.documentSubmission.create({
      data: {
        collaboratorDocumentTypeId: data.collaboratorDocumentTypeId,
        version: data.version,
        isCurrentVersion: true,
        fileName: data.fileName ?? null,
      },
    });
  },

  findAllByCollaboratorDocumentTypeId(collaboratorDocumentTypeId: string) {
    return prisma.documentSubmission.findMany({
      where: { collaboratorDocumentTypeId },
      orderBy: { version: "desc" },
    });
  },

  findPending(filters: PendingFilters, { skip, take }: { skip: number; take: number }) {
    return prisma.collaboratorDocumentType.findMany({
      where: buildPendingWhere(filters),
      include: {
        collaborator: { select: { id: true, name: true, email: true } },
        documentType: { select: { id: true, name: true } },
      },
      skip,
      take,
      orderBy: { createdAt: "asc" },
    });
  },

  countPending(filters: PendingFilters) {
    return prisma.collaboratorDocumentType.count({ where: buildPendingWhere(filters) });
  },
};

type PendingFilters = {
  collaboratorId?: string;
  documentTypeId?: string;
  collaboratorName?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

function buildPendingWhere({
  collaboratorId,
  documentTypeId,
  collaboratorName,
  createdFrom,
  createdTo,
}: PendingFilters): Prisma.CollaboratorDocumentTypeWhereInput {
  return {
    deletedAt: null,
    collaborator: {
      deletedAt: null,
      ...(collaboratorId && { id: collaboratorId }),
      ...(collaboratorName && {
        name: { contains: collaboratorName, mode: "insensitive" },
      }),
    },
    documentType: {
      deletedAt: null,
      ...(documentTypeId && { id: documentTypeId }),
    },
    submissions: {
      none: { isCurrentVersion: true },
    },
    ...((createdFrom || createdTo) && {
      createdAt: {
        ...(createdFrom && { gte: createdFrom }),
        ...(createdTo && { lte: createdTo }),
      },
    }),
  };
}
