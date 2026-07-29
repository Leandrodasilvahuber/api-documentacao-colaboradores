import { AppError } from '../../../shared/errors/AppError';
import { prisma } from '../../../shared/database/prisma';
import { collaboratorDocumentRepository } from '../../collaborator-document/collaborator-document.repository';
import { documentTypeRepository } from '../document-type.repository';
import { documentTypeService } from '../document-type.service';

jest.mock('../document-type.repository');
jest.mock('../../collaborator-document/collaborator-document.repository');
jest.mock('../../../shared/database/prisma', () => {
  const mockPrisma: { $transaction: jest.Mock } = { $transaction: jest.fn() };
  mockPrisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(mockPrisma),
  );
  return { prisma: mockPrisma };
});

const mockedRepository = documentTypeRepository as jest.Mocked<typeof documentTypeRepository>;
const mockedCollaboratorDocumentRepository = collaboratorDocumentRepository as jest.Mocked<
  typeof collaboratorDocumentRepository
>;

const documentType = {
  id: 'document-type-1',
  name: 'RG',
  description: 'Registro geral',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('documentTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a document type when name is not already in use', async () => {
      mockedRepository.findByName.mockResolvedValue(null);
      mockedRepository.create.mockResolvedValue(documentType);

      const result = await documentTypeService.create({
        name: documentType.name,
        description: documentType.description,
      });

      expect(mockedRepository.findByName).toHaveBeenCalledWith(documentType.name);
      expect(mockedRepository.create).toHaveBeenCalledWith({
        name: documentType.name,
        description: documentType.description,
      });
      expect(result).toEqual(documentType);
    });

    it('throws when name is already in use', async () => {
      mockedRepository.findByName.mockResolvedValue(documentType);

      await expect(
        documentTypeService.create({ name: documentType.name }),
      ).rejects.toThrow(AppError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated data with meta', async () => {
      mockedRepository.findAll.mockResolvedValue([documentType]);
      mockedRepository.count.mockResolvedValue(1);

      const result = await documentTypeService.findAll({ page: 1, limit: 10 });

      expect(mockedRepository.findAll).toHaveBeenCalledWith({ skip: 0, take: 10 });
      expect(result).toEqual({
        data: [documentType],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('computes skip based on page and limit', async () => {
      mockedRepository.findAll.mockResolvedValue([]);
      mockedRepository.count.mockResolvedValue(25);

      const result = await documentTypeService.findAll({ page: 3, limit: 10 });

      expect(mockedRepository.findAll).toHaveBeenCalledWith({ skip: 20, take: 10 });
      expect(result.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 });
    });
  });

  describe('findById', () => {
    it('returns the document type when found', async () => {
      mockedRepository.findById.mockResolvedValue(documentType);

      const result = await documentTypeService.findById(documentType.id);

      expect(mockedRepository.findById).toHaveBeenCalledWith(documentType.id);
      expect(result).toEqual(documentType);
    });

    it('throws when not found', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(documentTypeService.findById('missing-id')).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates the document type when it exists and name is not taken', async () => {
      mockedRepository.findById.mockResolvedValue(documentType);
      mockedRepository.findByName.mockResolvedValue(null);
      const updated = { ...documentType, name: 'CNH' };
      mockedRepository.update.mockResolvedValue(updated);

      const result = await documentTypeService.update(documentType.id, { name: 'CNH' });

      expect(mockedRepository.update).toHaveBeenCalledWith(documentType.id, { name: 'CNH' });
      expect(result).toEqual(updated);
    });

    it('throws when document type does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(documentTypeService.update('missing-id', { name: 'CNH' })).rejects.toThrow(
        AppError,
      );
      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('throws when new name belongs to another document type', async () => {
      mockedRepository.findById.mockResolvedValue(documentType);
      mockedRepository.findByName.mockResolvedValue({ ...documentType, id: 'other-id' });

      await expect(
        documentTypeService.update(documentType.id, { name: 'CNH' }),
      ).rejects.toThrow(AppError);
      expect(mockedRepository.update).not.toHaveBeenCalled();
    });

    it('allows keeping the same name', async () => {
      mockedRepository.findById.mockResolvedValue(documentType);
      mockedRepository.findByName.mockResolvedValue(documentType);
      mockedRepository.update.mockResolvedValue(documentType);

      const result = await documentTypeService.update(documentType.id, { name: documentType.name });

      expect(result).toEqual(documentType);
      expect(mockedRepository.update).toHaveBeenCalledWith(documentType.id, {
        name: documentType.name,
      });
    });
  });

  describe('delete', () => {
    it('deletes the document type and cascades soft delete to its links within a transaction', async () => {
      mockedRepository.findById.mockResolvedValue(documentType);
      mockedRepository.delete.mockResolvedValue({ ...documentType, deletedAt: new Date() });
      mockedCollaboratorDocumentRepository.deleteByDocumentTypeId.mockResolvedValue({ count: 2 });

      await documentTypeService.delete(documentType.id);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockedCollaboratorDocumentRepository.deleteByDocumentTypeId).toHaveBeenCalledWith(
        documentType.id,
        prisma,
      );
      expect(mockedRepository.delete).toHaveBeenCalledWith(documentType.id, prisma);
    });

    it('throws when document type does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(documentTypeService.delete('missing-id')).rejects.toThrow(AppError);
      expect(mockedRepository.delete).not.toHaveBeenCalled();
    });
  });
});
