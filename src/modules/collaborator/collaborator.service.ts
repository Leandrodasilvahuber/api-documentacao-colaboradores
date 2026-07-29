import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, getPaginationParams, PaginationInput } from '../../shared/utils/pagination';
import { collaboratorDocumentRepository } from '../collaborator-document/collaborator-document.repository';
import { collaboratorRepository } from './collaborator.repository';
import { CreateCollaboratorInput, UpdateCollaboratorInput } from './collaborator.schema';

export const collaboratorService = {
  async create(data: CreateCollaboratorInput) {
    const existing = await collaboratorRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Já existe um colaborador com este email', 409);
    }

    return collaboratorRepository.create(data);
  },

  async findAll(pagination: PaginationInput) {
    const { skip, take } = getPaginationParams(pagination);
    const [data, total] = await Promise.all([
      collaboratorRepository.findAll({ skip, take }),
      collaboratorRepository.count(),
    ]);

    return { data, meta: buildPaginationMeta(total, pagination) };
  },

  async findById(id: string) {
    const collaborator = await collaboratorRepository.findById(id);
    if (!collaborator) {
      throw new AppError('Colaborador não encontrado', 404);
    }

    return collaborator;
  },

  async update(id: string, data: UpdateCollaboratorInput) {
    await this.findById(id);

    if (data.email) {
      const existing = await collaboratorRepository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new AppError('Já existe um colaborador com este email', 409);
      }
    }

    return collaboratorRepository.update(id, data);
  },

  async delete(id: string) {
    await this.findById(id);

    return prisma.$transaction(async (tx) => {
      await collaboratorDocumentRepository.deleteByCollaboratorId(id, tx);
      return collaboratorRepository.delete(id, tx);
    });
  },
};
