import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Documentação de Colaboradores",
      version: "1.0.0",
      description:
        "API para gestão de colaboradores, tipos de documento, vínculos entre eles e envio/histórico de versões de documentos.",
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: "Ambiente local" }],
    tags: [
      { name: "Health", description: "Status da API" },
      { name: "Collaborators", description: "Cadastro de colaboradores" },
      { name: "DocumentTypes", description: "Tipos de documento" },
      {
        name: "CollaboratorDocuments",
        description: "Vínculo entre colaboradores e tipos de documento",
      },
      { name: "Submissions", description: "Envio e histórico de versões de documentos" },
      { name: "Pending", description: "Documentos pendentes de envio" },
      { name: "Statistics", description: "Estatísticas de conclusão e pendências" },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
        ValidationError: {
          type: "object",
          properties: {
            message: { type: "string", example: "Erro de validação" },
            issues: { type: "object" },
          },
          required: ["message", "issues"],
        },
        Collaborator: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Maria Silva" },
            email: { type: "string", format: "email", example: "maria.silva@empresa.com" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        DocumentType: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "RG" },
            description: { type: "string", nullable: true, example: "Documento de identidade" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        CollaboratorDocumentLink: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            collaboratorId: { type: "string", format: "uuid" },
            documentTypeId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        DocumentSubmission: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            collaboratorDocumentTypeId: { type: "string", format: "uuid" },
            version: { type: "integer", example: 1 },
            isCurrentVersion: { type: "boolean" },
            fileName: { type: "string", nullable: true, example: "rg-frente.pdf" },
            submittedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "integer", example: 42 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            totalPages: { type: "integer", example: 5 },
          },
        },
      },
    },
  },
  apis: ["./src/app.ts", "./src/modules/**/*.routes.ts"],
});

export { swaggerSpec };
