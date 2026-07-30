import { Prisma } from '../../../generated/prisma/client';
import { AppError } from '../../../shared/errors/AppError';
import { prisma } from '../../../shared/database/prisma';
import { collaboratorDocumentRepository } from '../../collaborator-document/collaborator-document.repository';
import { collaboratorRepository } from '../collaborator.repository';
import { collaboratorService } from '../collaborator.service';

jest.mock('../collaborator.repository');
jest.mock('../../collaborator-document/collaborator-document.repository');
jest.mock('../../../shared/database/prisma', () => {
  const mockPrisma: { $transaction: jest.Mock } = { $transaction: jest.fn() };
  mockPrisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(mockPrisma),
  );
  return { prisma: mockPrisma };
});

const mockedRepository = collaboratorRepository as jest.Mocked<typeof collaboratorRepository>;
const mockedCollaboratorDocumentRepository = collaboratorDocumentRepository as jest.Mocked<
  typeof collaboratorDocumentRepository
>;

const collaborator = {
  id: 'collaborator-1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('collaboratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a collaborator when email is not already in use', async () => {
      mockedRepository.findByEmail.mockResolvedValue(null);
      mockedRepository.create.mockResolvedValue(collaborator);

      const result = await collaboratorService.create({
        name: collaborator.name,
        email: collaborator.email,
      });

      expect(mockedRepository.findByEmail).toHaveBeenCalledWith(collaborator.email);
      expect(mockedRepository.create).toHaveBeenCalledWith({
        name: collaborator.name,
        email: collaborator.email,
      });
      expect(result).toEqual(collaborator);
    });

    it('throws when email is already in use', async () => {
      mockedRepository.findByEmail.mockResolvedValue(collaborator);

      await expect(
        collaboratorService.create({ name: collaborator.name, email: collaborator.email }),
      ).rejects.toThrow(AppError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('throws 409 when the unique constraint fails (concurrent create)', async () => {
      mockedRepository.findByEmail.mockResolvedValue(null);
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      mockedRepository.create.mockRejectedValue(uniqueError);

      await expect(
        collaboratorService.create({ name: collaborator.name, email: collaborator.email }),
      ).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 409,
        message: 'Já existe um colaborador com este email',
      });
    });

    it('rethrows errors that are not the unique constraint violation', async () => {
      mockedRepository.findByEmail.mockResolvedValue(null);
      const otherError = new Error('database is unreachable');
      mockedRepository.create.mockRejectedValue(otherError);

      await expect(
        collaboratorService.create({ name: collaborator.name, email: collaborator.email }),
      ).rejects.toThrow('database is unreachable');
    });
  });

  describe('findAll', () => {
    it('returns paginated data with meta', async () => {
      mockedRepository.findAll.mockResolvedValue([collaborator]);
      mockedRepository.count.mockResolvedValue(1);

      const result = await collaboratorService.findAll({ page: 1, limit: 10 });

      expect(mockedRepository.findAll).toHaveBeenCalledWith({ skip: 0, take: 10 });
      expect(result).toEqual({
        data: [collaborator],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('computes skip based on page and limit', async () => {
      mockedRepository.findAll.mockResolvedValue([]);
      mockedRepository.count.mockResolvedValue(25);

      const result = await collaboratorService.findAll({ page: 3, limit: 10 });

      expect(mockedRepository.findAll).toHaveBeenCalledWith({ skip: 20, take: 10 });
      expect(result.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 });
    });
  });

  describe('findById', () => {
    it('returns the collaborator when found', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);

      const result = await collaboratorService.findById(collaborator.id);

      expect(mockedRepository.findById).toHaveBeenCalledWith(collaborator.id);
      expect(result).toEqual(collaborator);
    });

    it('throws when not found', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(collaboratorService.findById('missing-id')).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates the collaborator when it exists and email is not taken', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.findByEmail.mockResolvedValue(null);
      const updated = { ...collaborator, name: 'Jane Doe' };
      mockedRepository.update.mockResolvedValue(updated);

      const result = await collaboratorService.update(collaborator.id, { name: 'Jane Doe' });

      expect(mockedRepository.update).toHaveBeenCalledWith(collaborator.id, { name: 'Jane Doe' });
      expect(result).toEqual(updated);
    });

    it('throws when collaborator does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(collaboratorService.update('missing-id', { name: 'Jane Doe' })).rejects.toThrow(
        AppError,
      );
      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('throws when new email belongs to another collaborator', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.findByEmail.mockResolvedValue({ ...collaborator, id: 'other-id' });

      await expect(
        collaboratorService.update(collaborator.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(AppError);
      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('allows keeping the same email', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.findByEmail.mockResolvedValue(collaborator);
      mockedRepository.update.mockResolvedValue(collaborator);

      const result = await collaboratorService.update(collaborator.id, { email: collaborator.email });

      expect(result).toEqual(collaborator);
      expect(mockedRepository.update).toHaveBeenCalledWith(collaborator.id, {
        email: collaborator.email,
      });
    });

    it('throws 409 when the unique constraint fails (concurrent update)', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.findByEmail.mockResolvedValue(null);
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      mockedRepository.update.mockRejectedValue(uniqueError);

      await expect(
        collaboratorService.update(collaborator.id, { email: 'taken@example.com' }),
      ).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 409,
        message: 'Já existe um colaborador com este email',
      });
    });

    it('rethrows errors that are not the unique constraint violation on update', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.findByEmail.mockResolvedValue(null);
      const otherError = new Error('database is unreachable');
      mockedRepository.update.mockRejectedValue(otherError);

      await expect(
        collaboratorService.update(collaborator.id, { email: 'taken@example.com' }),
      ).rejects.toThrow('database is unreachable');
    });
  });

  describe('delete', () => {
    it('deletes the collaborator and cascades soft delete to its document links within a transaction', async () => {
      mockedRepository.findById.mockResolvedValue(collaborator);
      mockedRepository.delete.mockResolvedValue({ ...collaborator, deletedAt: new Date() });
      mockedCollaboratorDocumentRepository.deleteByCollaboratorId.mockResolvedValue({ count: 2 });

      await collaboratorService.delete(collaborator.id);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockedCollaboratorDocumentRepository.deleteByCollaboratorId).toHaveBeenCalledWith(
        collaborator.id,
        prisma,
      );
      expect(mockedRepository.delete).toHaveBeenCalledWith(collaborator.id, prisma);
    });

    it('throws when collaborator does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(collaboratorService.delete('missing-id')).rejects.toThrow(AppError);
      expect(mockedRepository.delete).not.toHaveBeenCalled();
    });

    it('throws when deleting an already-deleted collaborator (double delete is not idempotent)', async () => {
      mockedRepository.findById.mockResolvedValueOnce(collaborator);
      mockedRepository.delete.mockResolvedValue({ ...collaborator, deletedAt: new Date() });
      mockedCollaboratorDocumentRepository.deleteByCollaboratorId.mockResolvedValue({ count: 0 });

      await collaboratorService.delete(collaborator.id);

      mockedRepository.findById.mockResolvedValueOnce(null);

      await expect(collaboratorService.delete(collaborator.id)).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 404,
      });
      expect(mockedRepository.delete).toHaveBeenCalledTimes(1);
    });
  });
});
