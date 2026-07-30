import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors/AppError";
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationInput,
} from "../../shared/utils/pagination";
import { collaboratorDocumentRepository } from "../collaborator-document/collaborator-document.repository";
import { documentTypeRepository } from "./document-type.repository";
import { CreateDocumentTypeInput, UpdateDocumentTypeInput } from "./document-type.schema";

function isDuplicateNameError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const documentTypeService = {
  async create(data: CreateDocumentTypeInput) {
    const existing = await documentTypeRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Já existe um tipo de documento com este nome", 409);
    }

    try {
      return await documentTypeRepository.create(data);
    } catch (error) {
      if (isDuplicateNameError(error)) {
        throw new AppError("Já existe um tipo de documento com este nome", 409);
      }
      throw error;
    }
  },

  async findAll(pagination: PaginationInput) {
    const { skip, take } = getPaginationParams(pagination);
    const [data, total] = await Promise.all([
      documentTypeRepository.findAll({ skip, take }),
      documentTypeRepository.count(),
    ]);

    return { data, meta: buildPaginationMeta(total, pagination) };
  },

  async findById(id: string) {
    const documentType = await documentTypeRepository.findById(id);
    if (!documentType) {
      throw new AppError("Tipo de documento não encontrado", 404);
    }

    return documentType;
  },

  async update(id: string, data: UpdateDocumentTypeInput) {
    await this.findById(id);

    if (data.name) {
      const existing = await documentTypeRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError("Já existe um tipo de documento com este nome", 409);
      }
    }

    try {
      return await documentTypeRepository.update(id, data);
    } catch (error) {
      if (isDuplicateNameError(error)) {
        throw new AppError("Já existe um tipo de documento com este nome", 409);
      }
      throw error;
    }
  },

  async delete(id: string) {
    await this.findById(id);

    return prisma.$transaction(async (tx) => {
      await collaboratorDocumentRepository.deleteByDocumentTypeId(id, tx);
      return documentTypeRepository.delete(id, tx);
    });
  },
};
