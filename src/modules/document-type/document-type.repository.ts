import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../generated/prisma/client";
import { CreateDocumentTypeInput, UpdateDocumentTypeInput } from "./document-type.schema";

type Client = Prisma.TransactionClient | typeof prisma;

export const documentTypeRepository = {
  create(data: CreateDocumentTypeInput) {
    return prisma.documentType.create({
      data: { ...data, description: data.description ?? null },
    });
  },

  findAll({ skip, take }: { skip: number; take: number }) {
    return prisma.documentType.findMany({ where: { deletedAt: null }, skip, take });
  },

  count() {
    return prisma.documentType.count({ where: { deletedAt: null } });
  },

  findById(id: string) {
    return prisma.documentType.findFirst({ where: { id, deletedAt: null } });
  },

  findByName(name: string) {
    return prisma.documentType.findFirst({ where: { name, deletedAt: null } });
  },

  findManyActiveByIds(ids: string[], client: Client = prisma) {
    return client.documentType.findMany({ where: { id: { in: ids }, deletedAt: null } });
  },

  update(id: string, data: UpdateDocumentTypeInput) {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    return prisma.documentType.update({ where: { id }, data: cleanData });
  },

  delete(id: string, client: Client = prisma) {
    return client.documentType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
