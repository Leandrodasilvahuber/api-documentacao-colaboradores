import { AppError } from "../../../shared/errors/AppError";
import { prisma } from "../../../shared/database/prisma";
import { collaboratorRepository } from "../../collaborator/collaborator.repository";
import { documentTypeRepository } from "../../document-type/document-type.repository";
import { collaboratorDocumentRepository } from "../collaborator-document.repository";
import { collaboratorDocumentService } from "../collaborator-document.service";

jest.mock("../collaborator-document.repository");
jest.mock("../../collaborator/collaborator.repository");
jest.mock("../../document-type/document-type.repository");
jest.mock("../../../shared/database/prisma", () => {
  const mockPrisma: { $transaction: jest.Mock } = { $transaction: jest.fn() };
  mockPrisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(mockPrisma),
  );
  return { prisma: mockPrisma };
});

const mockedCollaboratorDocumentRepository = collaboratorDocumentRepository as jest.Mocked<
  typeof collaboratorDocumentRepository
>;
const mockedCollaboratorRepository = collaboratorRepository as jest.Mocked<
  typeof collaboratorRepository
>;
const mockedDocumentTypeRepository = documentTypeRepository as jest.Mocked<
  typeof documentTypeRepository
>;

const collaborator = {
  id: "collaborator-1",
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const documentType = {
  id: "document-type-1",
  name: "RG",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const activeLink = {
  id: "link-1",
  collaboratorId: collaborator.id,
  documentTypeId: documentType.id,
  createdAt: new Date(),
  deletedAt: null,
};

const deletedLink = { ...activeLink, deletedAt: new Date() };

describe("collaboratorDocumentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listByCollaborator", () => {
    it("returns the active links with document type data", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      const links = [{ ...activeLink, documentType }];
      mockedCollaboratorDocumentRepository.findByCollaboratorId.mockResolvedValue(links);

      const result = await collaboratorDocumentService.listByCollaborator(collaborator.id);

      expect(mockedCollaboratorDocumentRepository.findByCollaboratorId).toHaveBeenCalledWith(
        collaborator.id,
      );
      expect(result).toEqual(links);
    });

    it("throws 404 when collaborator does not exist", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(collaboratorDocumentService.listByCollaborator("missing-id")).rejects.toThrow(
        AppError,
      );
      expect(mockedCollaboratorDocumentRepository.findByCollaboratorId).not.toHaveBeenCalled();
    });
  });

  describe("linkDocuments", () => {
    it("creates new links inside a transaction", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedDocumentTypeRepository.findById.mockResolvedValue(documentType);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        null,
      );
      mockedCollaboratorDocumentRepository.createMany.mockResolvedValue([activeLink]);

      const result = await collaboratorDocumentService.linkDocuments(collaborator.id, [
        documentType.id,
      ]);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockedCollaboratorDocumentRepository.createMany).toHaveBeenCalledWith(
        [{ collaboratorId: collaborator.id, documentTypeId: documentType.id }],
        prisma,
      );
      expect(result).toEqual({ created: [activeLink], reactivated: [] });
    });

    it("throws 404 when collaborator does not exist", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(
        collaboratorDocumentService.linkDocuments("missing-id", [documentType.id]),
      ).rejects.toThrow(AppError);
      expect(mockedDocumentTypeRepository.findById).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws 404 when a document type does not exist", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedDocumentTypeRepository.findById.mockResolvedValue(null);

      await expect(
        collaboratorDocumentService.linkDocuments(collaborator.id, ["missing-doc-type"]),
      ).rejects.toThrow(AppError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("silently ignores document types already actively linked", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedDocumentTypeRepository.findById.mockResolvedValue(documentType);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        activeLink,
      );

      const result = await collaboratorDocumentService.linkDocuments(collaborator.id, [
        documentType.id,
      ]);

      expect(mockedCollaboratorDocumentRepository.createMany).not.toHaveBeenCalled();
      expect(mockedCollaboratorDocumentRepository.reactivate).not.toHaveBeenCalled();
      expect(result).toEqual({ created: [], reactivated: [] });
    });

    it("reactivates previously soft-deleted links instead of creating duplicates", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedDocumentTypeRepository.findById.mockResolvedValue(documentType);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        deletedLink,
      );
      mockedCollaboratorDocumentRepository.reactivate.mockResolvedValue({
        ...deletedLink,
        deletedAt: null,
      });

      const result = await collaboratorDocumentService.linkDocuments(collaborator.id, [
        documentType.id,
      ]);

      expect(mockedCollaboratorDocumentRepository.reactivate).toHaveBeenCalledWith(
        deletedLink.id,
        prisma,
      );
      expect(mockedCollaboratorDocumentRepository.createMany).not.toHaveBeenCalled();
      expect(result.reactivated).toHaveLength(1);
    });
  });

  describe("unlinkDocument", () => {
    it("soft deletes the active link", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        activeLink,
      );
      mockedCollaboratorDocumentRepository.delete.mockResolvedValue(deletedLink);

      await collaboratorDocumentService.unlinkDocument(collaborator.id, documentType.id);

      expect(mockedCollaboratorDocumentRepository.delete).toHaveBeenCalledWith(activeLink.id);
    });

    it("throws 404 when collaborator does not exist", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(
        collaboratorDocumentService.unlinkDocument("missing-id", documentType.id),
      ).rejects.toThrow(AppError);
      expect(mockedCollaboratorDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it("throws 404 when the link does not exist", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        null,
      );

      await expect(
        collaboratorDocumentService.unlinkDocument(collaborator.id, "missing-doc-type"),
      ).rejects.toThrow(AppError);
      expect(mockedCollaboratorDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it("throws 404 when the link is already soft deleted", async () => {
      mockedCollaboratorRepository.findById.mockResolvedValue(collaborator);
      mockedCollaboratorDocumentRepository.findByCollaboratorAndDocumentType.mockResolvedValue(
        deletedLink,
      );

      await expect(
        collaboratorDocumentService.unlinkDocument(collaborator.id, documentType.id),
      ).rejects.toThrow(AppError);
      expect(mockedCollaboratorDocumentRepository.delete).not.toHaveBeenCalled();
    });
  });
});
