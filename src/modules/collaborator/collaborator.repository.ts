import { prisma } from '../../shared/database/prisma';
import { CreateCollaboratorInput, UpdateCollaboratorInput } from './collaborator.schema';

export const collaboratorRepository = {
  create(data: CreateCollaboratorInput) {
    return prisma.collaborator.create({ data });
  },

  findAll({ skip, take }: { skip: number; take: number }) {
    return prisma.collaborator.findMany({ where: { deletedAt: null }, skip, take });
  },

  count() {
    return prisma.collaborator.count({ where: { deletedAt: null } });
  },

  findById(id: string) {
    return prisma.collaborator.findFirst({ where: { id, deletedAt: null } });
  },

  findByEmail(email: string) {
    return prisma.collaborator.findFirst({ where: { email, deletedAt: null } });
  },

  update(id: string, data: UpdateCollaboratorInput) {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    return prisma.collaborator.update({ where: { id }, data: cleanData });
  },

  delete(id: string) {
    return prisma.collaborator.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
