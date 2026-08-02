import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/shared/database/prisma";
import { resetDatabase } from "./helpers/resetDatabase";

describe("Soft delete e reativação de vínculos", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reativa um vínculo removido em vez de criar um novo registro", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Carlos Souza",
      email: "carlos.souza.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({
      name: "CNH e2e",
    });
    const collaboratorId: string = collaborator.body.id;
    const documentTypeId: string = documentType.body.id;

    const firstLink = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });
    const linkId: string = firstLink.body.created[0].id;

    await request(app).delete(`/collaborators/${collaboratorId}/documents/${documentTypeId}`);

    const relink = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    expect(relink.status).toBe(201);
    expect(relink.body.created).toHaveLength(0);
    expect(relink.body.reactivated).toHaveLength(1);
    expect(relink.body.reactivated[0]).toMatchObject({ id: linkId, deletedAt: null });

    const links = await prisma.collaboratorDocumentType.findMany({ where: { collaboratorId } });
    expect(links).toHaveLength(1);
  });

  it("ao remover um colaborador, seus vínculos ativos ficam soft-deletados em cascata", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Beatriz Lima",
      email: "beatriz.lima.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({
      name: "Comprovante e2e",
    });
    const collaboratorId: string = collaborator.body.id;
    const documentTypeId: string = documentType.body.id;

    await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    const del = await request(app).delete(`/collaborators/${collaboratorId}`);
    expect(del.status).toBe(204);

    const link = await prisma.collaboratorDocumentType.findFirstOrThrow({
      where: { collaboratorId, documentTypeId },
    });
    expect(link.deletedAt).not.toBeNull();
  });

  it("ao remover um tipo de documento, seus vínculos ativos ficam soft-deletados em cascata", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Rafael Alves",
      email: "rafael.alves.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({
      name: "Contrato e2e",
    });
    const collaboratorId: string = collaborator.body.id;
    const documentTypeId: string = documentType.body.id;

    await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    const del = await request(app).delete(`/document-types/${documentTypeId}`);
    expect(del.status).toBe(204);

    const link = await prisma.collaboratorDocumentType.findFirstOrThrow({
      where: { collaboratorId, documentTypeId },
    });
    expect(link.deletedAt).not.toBeNull();
  });
});
