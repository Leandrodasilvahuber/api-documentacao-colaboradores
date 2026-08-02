import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../../shared/middlewares/errorHandler";
import { AppError } from "../../../shared/errors/AppError";
import { pendingDocumentRoutes, submissionRoutes } from "../submission.routes";
import { submissionService } from "../submission.service";

jest.mock("../submission.service");

const mockedService = submissionService as jest.Mocked<typeof submissionService>;

const collaboratorId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const documentTypeId = "6c84fb90-12c4-11e1-840d-7b25c5ee775a";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: jest.fn() } as unknown as Request["log"];
    next();
  });
  app.use("/collaborators/:collaboratorId/documents/:documentTypeId/submissions", submissionRoutes);
  app.use("/documents", pendingDocumentRoutes);
  app.use(errorHandler);
  return app;
}

const submission = {
  id: "e1a2b3c4-d5e6-7f89-a0b1-c2d3e4f56789",
  collaboratorDocumentTypeId: "f1a2b3c4-d5e6-7f89-a0b1-c2d3e4f56789",
  version: 1,
  fileName: "rg-frente.pdf",
  isCurrentVersion: true,
  submittedAt: new Date(),
};

const serialized = <T>(value: T) => JSON.parse(JSON.stringify(value)) as unknown;

describe("submissionController (smoke)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST .../submissions submits a new version and returns 201", async () => {
    mockedService.submit.mockResolvedValue(submission);

    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
      .send({ fileName: "rg-frente.pdf" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(serialized(submission));
    expect(mockedService.submit).toHaveBeenCalledWith(collaboratorId, documentTypeId, {
      fileName: "rg-frente.pdf",
    });
  });

  it("POST .../submissions returns 400 for an oversized fileName", async () => {
    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
      .send({ fileName: "a".repeat(256) });

    expect(res.status).toBe(400);
    expect(mockedService.submit).not.toHaveBeenCalled();
  });

  it("POST .../submissions returns 409 on a concurrent submit", async () => {
    mockedService.submit.mockRejectedValue(
      new AppError("Envio concorrente detectado, tente novamente", 409),
    );

    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
      .send({});

    expect(res.status).toBe(409);
  });

  it("GET .../submissions lists version history", async () => {
    mockedService.listVersions.mockResolvedValue([submission]);

    const res = await request(app).get(
      `/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized([submission]));
    expect(mockedService.listVersions).toHaveBeenCalledWith(collaboratorId, documentTypeId);
  });

  it("GET /documents/pending returns the paginated result", async () => {
    const paginated = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    mockedService.listPending.mockResolvedValue(paginated);

    const res = await request(app).get("/documents/pending");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(paginated);
  });

  it("GET /documents/pending returns 400 when createdFrom is after createdTo", async () => {
    const res = await request(app)
      .get("/documents/pending")
      .query({ createdFrom: "2026-02-01", createdTo: "2026-01-01" });

    expect(res.status).toBe(400);
    expect(mockedService.listPending).not.toHaveBeenCalled();
  });
});
