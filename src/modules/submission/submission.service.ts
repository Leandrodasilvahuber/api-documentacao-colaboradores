import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { buildPaginationMeta, getPaginationParams } from "../../shared/utils/pagination";
import { collaboratorDocumentRepository } from "../collaborator-document/collaborator-document.repository";
import { submissionRepository } from "./submission.repository";
import { CreateSubmissionInput, PendingQuery } from "./submission.schema";

async function findActiveLink(collaboratorId: string, documentTypeId: string) {
  const link = await collaboratorDocumentRepository.findByCollaboratorAndDocumentType(
    collaboratorId,
    documentTypeId,
  );

  if (!link || link.deletedAt !== null) {
    throw new AppError("Tipo de documento não está vinculado a este colaborador", 404);
  }

  return link;
}

export const submissionService = {
  async submit(collaboratorId: string, documentTypeId: string, data: CreateSubmissionInput) {
    const link = await findActiveLink(collaboratorId, documentTypeId);

    try {
      // Corridas entre submissões concorrentes são resolvidas pelo próprio Postgres
      // (unique index em version + isolamento serializable), nunca pela aplicação:
      // uma das duas perde e recebe 409 para retentar, em vez de arriscar corromper
      // o histórico de versões.
      return await prisma.$transaction(
        async (tx) => {
          const latestSubmission = await submissionRepository.findLatestVersion(link.id, tx);
          const nextVersion = latestSubmission ? latestSubmission.version + 1 : 1;

          await submissionRepository.deactivateCurrentVersion(link.id, tx);

          return submissionRepository.create(
            {
              collaboratorDocumentTypeId: link.id,
              version: nextVersion,
              ...(data.fileName !== undefined && { fileName: data.fileName }),
            },
            tx,
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        throw new AppError("Envio concorrente detectado, tente novamente", 409);
      }
      throw error;
    }
  },

  async listVersions(collaboratorId: string, documentTypeId: string) {
    const link = await findActiveLink(collaboratorId, documentTypeId);

    return submissionRepository.findAllByCollaboratorDocumentTypeId(link.id);
  },

  async listPending(query: PendingQuery) {
    const { skip, take } = getPaginationParams(query);
    const filters = {
      ...(query.collaboratorId !== undefined && { collaboratorId: query.collaboratorId }),
      ...(query.documentTypeId !== undefined && { documentTypeId: query.documentTypeId }),
      ...(query.collaboratorName !== undefined && { collaboratorName: query.collaboratorName }),
      ...(query.createdFrom !== undefined && { createdFrom: query.createdFrom }),
      ...(query.createdTo !== undefined && { createdTo: query.createdTo }),
    };

    const [data, total] = await Promise.all([
      submissionRepository.findPending(filters, { skip, take }),
      submissionRepository.countPending(filters),
    ]);

    return { data, meta: buildPaginationMeta(total, query) };
  },
};
