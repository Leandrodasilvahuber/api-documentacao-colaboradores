import express from "express";
import { collaboratorRoutes } from "./modules/collaborator/collaborator.routes";
import { collaboratorDocumentRoutes } from "./modules/collaborator-document/collaborator-document.routes";
import { documentTypeRoutes } from "./modules/document-type/document-type.routes";
import { pendingDocumentRoutes, submissionRoutes } from "./modules/submission/submission.routes";
import { statisticsRoutes } from "./modules/statistics/statistics.routes";
import { errorHandler } from "./shared/middlewares/errorHandler";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

app.use("/collaborators", collaboratorRoutes);
app.use("/collaborators/:collaboratorId/documents", collaboratorDocumentRoutes);
app.use("/document-types", documentTypeRoutes);
app.use(
  "/collaborators/:collaboratorId/documents/:documentTypeId/submissions",
  submissionRoutes,
);
app.use("/documents", pendingDocumentRoutes);
app.use("/statistics", statisticsRoutes);

app.use(errorHandler);

export { app };
