import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/shared/database/prisma";
import { resetDatabase } from "./helpers/resetDatabase";

describe("Pendências com filtros e estatísticas", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("filtra pendentes combinando collaboratorName e documentTypeId", async () => {
    const ana = await request(app).post("/collaborators").send({
      name: "Ana Torres",
      email: "ana.torres.e2e@example.com",
    });
    const bruno = await request(app).post("/collaborators").send({
      name: "Bruno Torres",
      email: "bruno.torres.e2e@example.com",
    });
    const rg = await request(app).post("/document-types").send({ name: "RG pending e2e" });
    const cpf = await request(app).post("/document-types").send({ name: "CPF pending e2e" });

    await request(app)
      .post(`/collaborators/${ana.body.id}/documents`)
      .send({ documentTypeIds: [rg.body.id, cpf.body.id] });
    await request(app)
      .post(`/collaborators/${bruno.body.id}/documents`)
      .send({ documentTypeIds: [rg.body.id] });

    const res = await request(app)
      .get("/documents/pending")
      .query({ collaboratorName: "Torres", documentTypeId: rg.body.id });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(
      res.body.data.map((item: { collaborator: { name: string } }) => item.collaborator.name),
    ).toEqual(expect.arrayContaining(["Ana Torres", "Bruno Torres"]));
    expect(
      res.body.data.every(
        (item: { documentType: { id: string } }) => item.documentType.id === rg.body.id,
      ),
    ).toBe(true);
  });

  it("não lista pendências de um colaborador removido", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Diego Fonseca",
      email: "diego.fonseca.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({ name: "Diploma e2e" });

    await request(app)
      .post(`/collaborators/${collaborator.body.id}/documents`)
      .send({ documentTypeIds: [documentType.body.id] });

    await request(app).delete(`/collaborators/${collaborator.body.id}`);

    const res = await request(app).get("/documents/pending");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("reflete ranking, completude e envios recentes após um cenário rico", async () => {
    const alice = await request(app).post("/collaborators").send({
      name: "Alice Ramos",
      email: "alice.ramos.e2e@example.com",
    });
    const bob = await request(app).post("/collaborators").send({
      name: "Bob Nogueira",
      email: "bob.nogueira.e2e@example.com",
    });
    const rg = await request(app).post("/document-types").send({ name: "RG stats e2e" });
    const cpf = await request(app).post("/document-types").send({ name: "CPF stats e2e" });

    await request(app)
      .post(`/collaborators/${alice.body.id}/documents`)
      .send({ documentTypeIds: [rg.body.id, cpf.body.id] });
    await request(app)
      .post(`/collaborators/${bob.body.id}/documents`)
      .send({ documentTypeIds: [rg.body.id, cpf.body.id] });

    // Alice envia os dois documentos; Bob não envia nenhum -> RG e CPF empatados
    // com 1 pendência cada, desempate alfabético (CPF antes de RG).
    await request(app)
      .post(`/collaborators/${alice.body.id}/documents/${rg.body.id}/submissions`)
      .send({ fileName: "alice-rg.pdf" });
    await request(app)
      .post(`/collaborators/${alice.body.id}/documents/${cpf.body.id}/submissions`)
      .send({ fileName: "alice-cpf.pdf" });

    const completion = await request(app).get("/statistics/completion");
    expect(completion.status).toBe(200);
    expect(completion.body).toMatchObject({ total: 4, submitted: 2, pending: 2, percentage: 50 });

    const ranking = await request(app).get("/statistics/pending-ranking");
    expect(ranking.status).toBe(200);
    expect(ranking.body).toHaveLength(2);
    expect(ranking.body.map((item: { documentTypeName: string }) => item.documentTypeName)).toEqual(
      ["CPF stats e2e", "RG stats e2e"],
    );
    expect(ranking.body.every((item: { pending: number }) => item.pending === 1)).toBe(true);

    const recent = await request(app).get("/statistics/recent-submissions").query({ limit: 1 });
    expect(recent.status).toBe(200);
    expect(recent.body).toHaveLength(1);
    expect(recent.body[0]).toMatchObject({ fileName: "alice-cpf.pdf" });
  });
});

describe("Envio concorrente de documentos", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("resolve submits paralelos aceitando apenas uma versão e rejeitando o resto com 409", async () => {
    const collaborator = await request(app).post("/collaborators").send({
      name: "Fernanda Costa",
      email: "fernanda.costa.e2e@example.com",
    });
    const documentType = await request(app).post("/document-types").send({ name: "Crachá e2e" });
    const collaboratorId: string = collaborator.body.id;
    const documentTypeId: string = documentType.body.id;

    await request(app)
      .post(`/collaborators/${collaboratorId}/documents`)
      .send({ documentTypeIds: [documentTypeId] });

    const concurrentSubmits = 8;
    const responses = await Promise.all(
      Array.from({ length: concurrentSubmits }, (_, index) =>
        request(app)
          .post(`/collaborators/${collaboratorId}/documents/${documentTypeId}/submissions`)
          .send({ fileName: `cracha-${index}.pdf` }),
      ),
    );

    const successes = responses.filter((res) => res.status === 201);
    const conflicts = responses.filter((res) => res.status === 409);

    expect(successes.length + conflicts.length).toBe(concurrentSubmits);
    expect(conflicts.length).toBeGreaterThan(0);

    const link = await prisma.collaboratorDocumentType.findFirstOrThrow({
      where: { collaboratorId, documentTypeId },
    });
    const submissions = await prisma.documentSubmission.findMany({
      where: { collaboratorDocumentTypeId: link.id },
    });
    expect(submissions).toHaveLength(successes.length);
  });
});
