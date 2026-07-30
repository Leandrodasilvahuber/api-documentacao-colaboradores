import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/shared/database/prisma";
import { resetDatabase } from "./helpers/resetDatabase";

describe("Fluxo completo: colaborador -> tipo de documento -> vínculo -> envio", () => {
  let collaboratorId: string;
  let documentTypeId: string;

  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cria um colaborador", async () => {
    const res = await request(app).post("/collaborators").send({
      name: "Maria Silva",
      email: "maria.silva.e2e@example.com",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Maria Silva", email: "maria.silva.e2e@example.com" });
    collaboratorId = res.body.id;
  });

  it("cria um tipo de documento", async () => {
    const res = await request(app).post("/document-types").send({
      name: "RG e2e",
      description: "Documento de identidade",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "RG e2e" });
    documentTypeId = res.body.id;
  });

  it("vincula o tipo de documento ao colaborador", async () => {
    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0]).toMatchObject({ documentTypeId });
  });

  it("envia a primeira versão do documento", async () => {
    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
      .send({ fileName: "rg-frente-v1.pdf" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      version: 1,
      isCurrentVersion: true,
      fileName: "rg-frente-v1.pdf",
    });
  });

  it("reenvia o documento criando a versão 2 e desativa a versão 1", async () => {
    const res = await request(app)
      .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
      .send({ fileName: "rg-frente-v2.pdf" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ version: 2, isCurrentVersion: true });

    const link = await prisma.collaboratorDocumentType.findFirstOrThrow({
      where: { collaboratorId, documentTypeId },
    });
    const previousVersion = await prisma.documentSubmission.findFirstOrThrow({
      where: { collaboratorDocumentTypeId: link.id, version: 1 },
    });
    expect(previousVersion.isCurrentVersion).toBe(false);
  });

  it("lista o histórico de versões, mais recente primeiro", async () => {
    const res = await request(app).get(
      `/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ version: 2 });
    expect(res.body[1]).toMatchObject({ version: 1 });
  });

  it("não lista mais o vínculo como pendente, já que foi enviado", async () => {
    const res = await request(app).get("/documents/pending");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("reflete 100% de completude nas estatísticas", async () => {
    const res = await request(app).get("/statistics/completion");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, submitted: 1, pending: 0, percentage: 100 });
  });
});
