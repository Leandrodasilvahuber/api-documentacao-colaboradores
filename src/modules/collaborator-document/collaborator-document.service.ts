import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/AppError';
import { collaboratorRepository } from '../collaborator/collaborator.repository';
import { documentTypeRepository } from '../document-type/document-type.repository';
import { collaboratorDocumentRepository } from './collaborator-document.repository';

export const collaboratorDocumentService = {
  async listByCollaborator(collaboratorId: string) {
    const collaborator = await collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new AppError('Colaborador não encontrado', 404);
    }

    return collaboratorDocumentRepository.findByCollaboratorId(collaboratorId);
  },

  async linkDocuments(collaboratorId: string, documentTypeIds: string[]) {
    const collaborator = await collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new AppError('Colaborador não encontrado', 404);
    }

    for (const documentTypeId of documentTypeIds) {
      const documentType = await documentTypeRepository.findById(documentTypeId);
      if (!documentType) {
        throw new AppError(`Tipo de documento não encontrado: ${documentTypeId}`, 404);
      }
    }

    const toCreate: { collaboratorId: string; documentTypeId: string }[] = [];
    const toReactivate: string[] = [];

    for (const documentTypeId of documentTypeIds) {
      const existing = await collaboratorDocumentRepository.findByCollaboratorAndDocumentType(
        collaboratorId,
        documentTypeId,
      );

      if (existing && existing.deletedAt === null) {
        continue;
      }

      if (existing) {
        toReactivate.push(existing.id);
      } else {
        toCreate.push({ collaboratorId, documentTypeId });
      }
    }

    return prisma.$transaction(async (tx) => {
      const reactivated = await Promise.all(
        toReactivate.map((id) => collaboratorDocumentRepository.reactivate(id, tx)),
      );

      const created =
        toCreate.length > 0 ? await collaboratorDocumentRepository.createMany(toCreate, tx) : [];

      return { created, reactivated };
    });
  },

  async unlinkDocument(collaboratorId: string, documentTypeId: string) {
    const collaborator = await collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new AppError('Colaborador não encontrado', 404);
    }

    const link = await collaboratorDocumentRepository.findByCollaboratorAndDocumentType(
      collaboratorId,
      documentTypeId,
    );

    if (!link || link.deletedAt !== null) {
      throw new AppError('Tipo de documento não está vinculado a este colaborador', 404);
    }

    return collaboratorDocumentRepository.delete(link.id);
  },
};
