import { prisma } from '../../shared/database/prisma';
import { Prisma } from '../../generated/prisma/client';

type Client = Prisma.TransactionClient | typeof prisma;

export const collaboratorDocumentRepository = {
  findByCollaboratorId(collaboratorId: string) {
    return prisma.collaboratorDocumentType.findMany({
      where: { collaboratorId, deletedAt: null },
      include: { documentType: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  findByCollaboratorAndDocumentType(collaboratorId: string, documentTypeId: string) {
    return prisma.collaboratorDocumentType.findFirst({
      where: { collaboratorId, documentTypeId },
    });
  },

  createMany(data: { collaboratorId: string; documentTypeId: string }[], client: Client = prisma) {
    return Promise.all(
      data.map((item) => client.collaboratorDocumentType.create({ data: item })),
    );
  },

  reactivate(id: string, client: Client = prisma) {
    return client.collaboratorDocumentType.update({
      where: { id },
      data: { deletedAt: null },
    });
  },

  delete(id: string) {
    return prisma.collaboratorDocumentType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  deleteByCollaboratorId(collaboratorId: string, client: Client = prisma) {
    return client.collaboratorDocumentType.updateMany({
      where: { collaboratorId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  deleteByDocumentTypeId(documentTypeId: string, client: Client = prisma) {
    return client.collaboratorDocumentType.updateMany({
      where: { documentTypeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
