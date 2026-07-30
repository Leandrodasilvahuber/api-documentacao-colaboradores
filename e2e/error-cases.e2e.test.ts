import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/shared/database/prisma";
import { resetDatabase } from "./helpers/resetDatabase";

describe("Casos de erro principais", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("retorna 409 ao criar colaborador com email já em uso", async () => {
    await request(app).post("/collaborators").send({
      name: "João Souza",
      email: "joao.souza.e2e@example.com",
    });

    const res = await request(app).post("/collaborators").send({
      name: "João Souza Duplicado",
      email: "joao.souza.e2e@example.com",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });

  it("retorna 404 ao enviar documento para um vínculo inexistente", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Ana Pereira",
      email: "ana.pereira.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({
      name: "CPF e2e",
    });

    const res = await request(app)
      .post(`/collaborators/${collaborator.body.id}/documents/${documentType.body.id}/submissions`)
      .send({ fileName: "cpf.pdf" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});
