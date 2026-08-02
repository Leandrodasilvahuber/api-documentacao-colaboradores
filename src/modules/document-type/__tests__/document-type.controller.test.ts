import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../../shared/middlewares/errorHandler";
import { AppError } from "../../../shared/errors/AppError";
import { documentTypeRoutes } from "../document-type.routes";
import { documentTypeService } from "../document-type.service";

jest.mock("../document-type.service");

const mockedService = documentTypeService as jest.Mocked<typeof documentTypeService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: jest.fn() } as unknown as Request["log"];
    next();
  });
  app.use("/document-types", documentTypeRoutes);
  app.use(errorHandler);
  return app;
}

const documentType = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  name: "RG",
  description: "Documento de identidade",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const serialized = <T>(value: T) => JSON.parse(JSON.stringify(value)) as unknown;

describe("documentTypeController (smoke)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /document-types creates and returns 201", async () => {
    mockedService.create.mockResolvedValue(documentType);

    const res = await request(app)
      .post("/document-types")
      .send({ name: "RG", description: "Documento de identidade" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(serialized(documentType));
  });

  it("POST /document-types returns 400 for an empty name", async () => {
    const res = await request(app).post("/document-types").send({ name: "" });

    expect(res.status).toBe(400);
    expect(mockedService.create).not.toHaveBeenCalled();
  });

  it("GET /document-types returns the paginated result", async () => {
    const paginated = {
      data: [documentType],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    mockedService.findAll.mockResolvedValue(paginated);

    const res = await request(app).get("/document-types");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized(paginated));
  });

  it("GET /document-types/:id returns 404 when not found", async () => {
    mockedService.findById.mockRejectedValue(new AppError("Tipo de documento não encontrado", 404));

    const res = await request(app).get(`/document-types/${documentType.id}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Tipo de documento não encontrado" });
  });

  it("PUT /document-types/:id returns 409 when the name is already in use", async () => {
    mockedService.update.mockRejectedValue(
      new AppError("Já existe um tipo de documento com este nome", 409),
    );

    const res = await request(app).put(`/document-types/${documentType.id}`).send({ name: "RG" });

    expect(res.status).toBe(409);
  });

  it("DELETE /document-types/:id returns 204", async () => {
    mockedService.delete.mockResolvedValue(documentType);

    const res = await request(app).delete(`/document-types/${documentType.id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });
});
