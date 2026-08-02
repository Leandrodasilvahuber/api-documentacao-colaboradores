import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../../shared/middlewares/errorHandler";
import { AppError } from "../../../shared/errors/AppError";
import { collaboratorRoutes } from "../collaborator.routes";
import { collaboratorService } from "../collaborator.service";

jest.mock("../collaborator.service");

const mockedService = collaboratorService as jest.Mocked<typeof collaboratorService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: jest.fn() } as unknown as Request["log"];
    next();
  });
  app.use("/collaborators", collaboratorRoutes);
  app.use(errorHandler);
  return app;
}

const collaborator = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const serialized = <T>(value: T) => JSON.parse(JSON.stringify(value)) as unknown;

describe("collaboratorController (smoke)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /collaborators creates a collaborator and returns 201", async () => {
    mockedService.create.mockResolvedValue(collaborator);

    const res = await request(app)
      .post("/collaborators")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(serialized(collaborator));
    expect(mockedService.create).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
    });
  });

  it("POST /collaborators returns 400 with validation issues for an invalid body", async () => {
    const res = await request(app).post("/collaborators").send({ name: "", email: "not-email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Erro de validação");
    expect(mockedService.create).not.toHaveBeenCalled();
  });

  it("GET /collaborators returns the paginated result from the service", async () => {
    const paginated = {
      data: [collaborator],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    mockedService.findAll.mockResolvedValue(paginated);

    const res = await request(app).get("/collaborators").query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized(paginated));
    expect(mockedService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("GET /collaborators/:id returns 200 with the collaborator", async () => {
    mockedService.findById.mockResolvedValue(collaborator);

    const res = await request(app).get(`/collaborators/${collaborator.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized(collaborator));
  });

  it("GET /collaborators/:id returns 400 for a non-uuid id", async () => {
    const res = await request(app).get("/collaborators/not-a-uuid");

    expect(res.status).toBe(400);
    expect(mockedService.findById).not.toHaveBeenCalled();
  });

  it("GET /collaborators/:id returns 404 when the service throws AppError", async () => {
    mockedService.findById.mockRejectedValue(new AppError("Colaborador não encontrado", 404));

    const res = await request(app).get(`/collaborators/${collaborator.id}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Colaborador não encontrado" });
  });

  it("PUT /collaborators/:id updates and returns 200", async () => {
    const updated = { ...collaborator, name: "Jane Doe" };
    mockedService.update.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/collaborators/${collaborator.id}`)
      .send({ name: "Jane Doe" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(serialized(updated));
    expect(mockedService.update).toHaveBeenCalledWith(collaborator.id, { name: "Jane Doe" });
  });

  it("DELETE /collaborators/:id returns 204 with an empty body", async () => {
    mockedService.delete.mockResolvedValue(collaborator);

    const res = await request(app).delete(`/collaborators/${collaborator.id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });
});
