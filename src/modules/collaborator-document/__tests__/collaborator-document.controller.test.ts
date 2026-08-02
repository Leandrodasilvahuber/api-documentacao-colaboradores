import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../../shared/middlewares/errorHandler";
import { AppError } from "../../../shared/errors/AppError";
import { collaboratorDocumentRoutes } from "../collaborator-document.routes";
import { collaboratorDocumentService } from "../collaborator-document.service";

jest.mock("../collaborator-document.service");

const mockedService = collaboratorDocumentService as jest.Mocked<
  typeof collaboratorDocumentService
>;

const collaboratorId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const documentTypeId = "6c84fb90-12c4-11e1-840d-7b25c5ee775a";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: jest.fn() } as unknown as Request["log"];
    next();
  });
  app.use("/collaborators/:collaboratorId/documents", collaboratorDocumentRoutes);
  app.use(errorHandler);
  return app;
}

const link = {
  id: "e1a2b3c4-d5e6-7f89-a0b1-c2d3e4f56789",
  collaboratorId,
  documentTypeId,
  createdAt: new Date(),
  deletedAt: null,
};

const linkWithDocumentType = {
  ...link,
  documentType: {
    id: documentTypeId,
    name: "RG",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
};

const serialized = <T>(value: T) => JSON.parse(JSON.stringify(value)) as unknown;

describe("collaboratorDocumentController (smoke)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /collaborators/:collaboratorId/documents lists the links", async () => {
    mockedService.listByCollaborator.mockResolvedValue([linkWithDocumentType]);

    const res = await request(app).get(`/collaborators/${collaboratorId}/documents`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized([linkWithDocumentType]));
    expect(mockedService.listByCollaborator).toHaveBeenCalledWith(collaboratorId);
  });

  it("GET returns 400 for a non-uuid collaboratorId", async () => {
    const res = await request(app).get("/collaborators/not-a-uuid/documents");

    expect(res.status).toBe(400);
    expect(mockedService.listByCollaborator).not.toHaveBeenCalled();
  });

  it("POST /collaborators/:collaboratorId/documents links document types and returns 201", async () => {
    mockedService.linkDocuments.mockResolvedValue({ created: [link], reactivated: [] });

    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(serialized({ created: [link], reactivated: [] }));
    expect(mockedService.linkDocuments).toHaveBeenCalledWith(collaboratorId, [documentTypeId]);
  });

  it("POST returns 400 when documentTypeIds is empty", async () => {
    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [] });

    expect(res.status).toBe(400);
    expect(mockedService.linkDocuments).not.toHaveBeenCalled();
  });

  it("POST returns 404 when the collaborator does not exist", async () => {
    mockedService.linkDocuments.mockRejectedValue(new AppError("Colaborador não encontrado", 404));

    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    expect(res.status).toBe(404);
  });

  it("DELETE /collaborators/:collaboratorId/documents/:documentTypeId unlinks and returns 204", async () => {
    mockedService.unlinkDocument.mockResolvedValue(link);

    const res = await request(app).delete(
      `/collaborators/${collaboratorId}/documents/${documentTypeId}`,
    );

    expect(res.status).toBe(204);
    expect(mockedService.unlinkDocument).toHaveBeenCalledWith(collaboratorId, documentTypeId);
  });
});
