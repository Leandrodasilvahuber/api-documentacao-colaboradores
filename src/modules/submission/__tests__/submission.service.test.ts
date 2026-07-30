import { Prisma } from '../../../generated/prisma/client';
import { AppError } from '../../../shared/errors/AppError';
import { prisma } from '../../../shared/database/prisma';
import { collaboratorDocumentRepository } from '../../collaborator-document/collaborator-document.repository';
import { submissionRepository } from '../submission.repository';
import { submissionService } from '../submission.service';

jest.mock('../submission.repository');
jest.mock('../../collaborator-document/collaborator-document.repository');
jest.mock('../../../shared/database/prisma', () => {
  const mockPrisma: { $transaction: jest.Mock } = { $transaction: jest.fn() };
  mockPrisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(mockPrisma),
  );
  return { prisma: mockPrisma };
});

const mockedSubmissionRepository = submissionRepository as jest.Mocked<typeof submissionRepository>;
const mockedCollaboratorDocumentRepository = collaboratorDocumentRepository as jest.Mocked<
  typeof collaboratorDocumentRepository
>;

const activeLink = {
  id: 'link-1',
  collaboratorId: 'collaborator-1',
  documentTypeId: 'document-type-1',
  createdAt: new Date(),
  deletedAt: null,
};

const deletedLink = { ...activeLink, deletedAt: new Date() };

describe('submissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
      activeLink,
    );
  });

  describe('submit', () => {
    it('creates the first version with version=1 and isCurrentVersion=true', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue(null);
      const created = {
        id: 'submission-1',
        collaboratorDocumentTypeId: activeLink.id,
        version: 1,
        isCurrentVersion: true,
        fileName: 'cpf.pdf',
        submittedAt: new Date(),
        createdAt: new Date(),
      };
      mockedSubmissionRepository.create.mockResolvedValue(created);

      const result = await submissionService.submit(
        activeLink.collaboratorId,
        activeLink.documentTypeId,
        { fileName: 'cpf.pdf' },
      );

      expect(mockedSubmissionRepository.deactivateCurrentVersion).toHaveBeenCalledWith(
        activeLink.id,
        prisma,
      );
      expect(mockedSubmissionRepository.create).toHaveBeenCalledWith(
        { collaboratorDocumentTypeId: activeLink.id, version: 1, fileName: 'cpf.pdf' },
        prisma,
      );
      expect(result).toEqual(created);
    });

    it('increments the version and deactivates the previous one on resubmission', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue({
        id: 'submission-1',
        collaboratorDocumentTypeId: activeLink.id,
        version: 1,
        isCurrentVersion: true,
        fileName: 'cpf.pdf',
        submittedAt: new Date(),
        createdAt: new Date(),
      });
      const created = {
        id: 'submission-2',
        collaboratorDocumentTypeId: activeLink.id,
        version: 2,
        isCurrentVersion: true,
        fileName: 'cpf_v2.pdf',
        submittedAt: new Date(),
        createdAt: new Date(),
      };
      mockedSubmissionRepository.create.mockResolvedValue(created);

      const result = await submissionService.submit(
        activeLink.collaboratorId,
        activeLink.documentTypeId,
        { fileName: 'cpf_v2.pdf' },
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockedSubmissionRepository.deactivateCurrentVersion).toHaveBeenCalledWith(
        activeLink.id,
        prisma,
      );
      expect(mockedSubmissionRepository.create).toHaveBeenCalledWith(
        { collaboratorDocumentTypeId: activeLink.id, version: 2, fileName: 'cpf_v2.pdf' },
        prisma,
      );
      expect(result.version).toBe(2);
    });

    it('works without fileName since it is optional', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue(null);
      mockedSubmissionRepository.create.mockResolvedValue({
        id: 'submission-1',
        collaboratorDocumentTypeId: activeLink.id,
        version: 1,
        isCurrentVersion: true,
        fileName: null,
        submittedAt: new Date(),
        createdAt: new Date(),
      });

      await submissionService.submit(activeLink.collaboratorId, activeLink.documentTypeId, {});

      expect(mockedSubmissionRepository.create).toHaveBeenCalledWith(
        { collaboratorDocumentTypeId: activeLink.id, version: 1 },
        prisma,
      );
    });

    it('throws 404 when the link does not exist', async () => {
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        null,
      );

      await expect(
        submissionService.submit('collaborator-1', 'document-type-1', {}),
      ).rejects.toThrow(AppError);
      expect(mockedSubmissionRepository.findLatestVersion).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws 404 when the link is soft deleted', async () => {
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        deletedLink,
      );

      await expect(
        submissionService.submit('collaborator-1', 'document-type-1', {}),
      ).rejects.toThrow(AppError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws 409 when the unique constraint fails (concurrent submission)', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue(null);
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(uniqueError);

      await expect(
        submissionService.submit(activeLink.collaboratorId, activeLink.documentTypeId, {}),
      ).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 409,
        message: 'Envio concorrente detectado, tente novamente',
      });
    });

    it('rethrows errors that are not the unique constraint violation', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue(null);
      const otherError = new Error('database is unreachable');
      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(otherError);

      await expect(
        submissionService.submit(activeLink.collaboratorId, activeLink.documentTypeId, {}),
      ).rejects.toThrow('database is unreachable');
    });

    it('não chama submissionRepository.create quando desativar a versão atual falha (rollback simulado)', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue(null);
      mockedSubmissionRepository.deactivateCurrentVersion.mockRejectedValue(
        new Error('falha simulada'),
      );

      await expect(
        submissionService.submit(activeLink.collaboratorId, activeLink.documentTypeId, {}),
      ).rejects.toThrow('falha simulada');
      expect(mockedSubmissionRepository.create).not.toHaveBeenCalled();
    });

    it('não retorna sucesso quando a criação da nova versão falha durante um reenvio (rollback simulado)', async () => {
      mockedSubmissionRepository.findLatestVersion.mockResolvedValue({
        id: 'submission-1',
        collaboratorDocumentTypeId: activeLink.id,
        version: 1,
        isCurrentVersion: true,
        fileName: 'cpf.pdf',
        submittedAt: new Date(),
        createdAt: new Date(),
      });
      mockedSubmissionRepository.deactivateCurrentVersion.mockResolvedValue(undefined as never);
      mockedSubmissionRepository.create.mockRejectedValue(new Error('falha simulada'));

      await expect(
        submissionService.submit(activeLink.collaboratorId, activeLink.documentTypeId, {
          fileName: 'cpf_v2.pdf',
        }),
      ).rejects.toThrow('falha simulada');

      expect(mockedSubmissionRepository.deactivateCurrentVersion).toHaveBeenCalledWith(
        activeLink.id,
        prisma,
      );
      expect(mockedSubmissionRepository.create).toHaveBeenCalledWith(
        { collaboratorDocumentTypeId: activeLink.id, version: 2, fileName: 'cpf_v2.pdf' },
        prisma,
      );
    });
  });

  describe('listVersions', () => {
    it('returns all versions ordered by version desc', async () => {
      const versions = [
        { version: 2, isCurrentVersion: true },
        { version: 1, isCurrentVersion: false },
      ];
      mockedSubmissionRepository.findAllByCollaboratorDocumentTypeId.mockResolvedValue(
        versions as never,
      );

      const result = await submissionService.listVersions(
        activeLink.collaboratorId,
        activeLink.documentTypeId,
      );

      expect(mockedSubmissionRepository.findAllByCollaboratorDocumentTypeId).toHaveBeenCalledWith(
        activeLink.id,
      );
      expect(result).toEqual(versions);
    });

    it('throws 404 when the link does not exist', async () => {
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        null,
      );

      await expect(
        submissionService.listVersions('collaborator-1', 'document-type-1'),
      ).rejects.toThrow(AppError);
    });

    it('throws 404 when the link is soft deleted (blocks listing for a removed collaborator link)', async () => {
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        deletedLink,
      );

      await expect(
        submissionService.listVersions('collaborator-1', 'document-type-1'),
      ).rejects.toMatchObject({ name: 'AppError', statusCode: 404 });
      expect(mockedSubmissionRepository.findAllByCollaboratorDocumentTypeId).not.toHaveBeenCalled();
    });

    it('returns an empty array when there are no submissions', async () => {
      mockedSubmissionRepository.findAllByCollaboratorDocumentTypeId.mockResolvedValue([]);

      const result = await submissionService.listVersions(
        activeLink.collaboratorId,
        activeLink.documentTypeId,
      );

      expect(result).toEqual([]);
    });
  });

  describe('listPending', () => {
    it('delegates to the repository with pagination and filters', async () => {
      mockedSubmissionRepository.findPending.mockResolvedValue([]);
      mockedSubmissionRepository.countPending.mockResolvedValue(0);

      const result = await submissionService.listPending({
        page: 2,
        limit: 5,
        collaboratorName: 'joao',
      });

      expect(mockedSubmissionRepository.findPending).toHaveBeenCalledWith(
        { collaboratorName: 'joao' },
        { skip: 5, take: 5 },
      );
      expect(mockedSubmissionRepository.countPending).toHaveBeenCalledWith({
        collaboratorName: 'joao',
      });
      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
      });
    });

    it('delegates the createdFrom/createdTo filters to the repository', async () => {
      mockedSubmissionRepository.findPending.mockResolvedValue([]);
      mockedSubmissionRepository.countPending.mockResolvedValue(0);
      const createdFrom = new Date('2026-07-01');
      const createdTo = new Date('2026-07-31');

      await submissionService.listPending({
        page: 1,
        limit: 20,
        createdFrom,
        createdTo,
      });

      expect(mockedSubmissionRepository.findPending).toHaveBeenCalledWith(
        { createdFrom, createdTo },
        { skip: 0, take: 20 },
      );
      expect(mockedSubmissionRepository.countPending).toHaveBeenCalledWith({
        createdFrom,
        createdTo,
      });
    });
  });
});
