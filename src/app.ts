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

const app = express();

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

app.use("/collaborators", collaboratorRoutes);
app.use("/collaborators/:collaboratorId/documents", collaboratorDocumentRoutes);
app.use("/document-types", documentTypeRoutes);
app.use("/collaborators/:collaboratorId/documents/:documentTypeId/submissions", submissionRoutes);
app.use("/documents", pendingDocumentRoutes);
app.use("/statistics", statisticsRoutes);

app.use(errorHandler);

export { app };
