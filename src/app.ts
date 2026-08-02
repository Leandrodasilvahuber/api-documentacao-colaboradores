import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { collaboratorRoutes } from "./modules/collaborator/collaborator.routes";
import { collaboratorDocumentRoutes } from "./modules/collaborator-document/collaborator-document.routes";
import { documentTypeRoutes } from "./modules/document-type/document-type.routes";
import { pendingDocumentRoutes, submissionRoutes } from "./modules/submission/submission.routes";
import { statisticsRoutes } from "./modules/statistics/statistics.routes";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { logger } from "./shared/logger";
import { swaggerSpec } from "./config/swagger";
import { prisma } from "./shared/database/prisma";

const app = express();
app.disable("x-powered-by");

app.use(cors({ origin: true }));
app.use(pinoHttp({ logger }));
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Verifica se a API está no ar
 *     responses:
 *       200:
 *         description: API respondendo normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: api-documentacao-colaboradores
 */
app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica se a API consegue se comunicar com o banco de dados
 *     responses:
 *       200:
 *         description: Aplicação e banco de dados respondendo normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *       503:
 *         description: Banco de dados indisponível
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unavailable
 */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/collaborators", collaboratorRoutes);
app.use("/collaborators/:collaboratorId/documents", collaboratorDocumentRoutes);
app.use("/document-types", documentTypeRoutes);
app.use("/collaborators/:collaboratorId/documents/:documentTypeId/submissions", submissionRoutes);
app.use("/documents", pendingDocumentRoutes);
app.use("/statistics", statisticsRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.use(errorHandler);

export { app };
