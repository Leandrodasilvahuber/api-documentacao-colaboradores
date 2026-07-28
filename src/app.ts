import express from "express";
import { collaboratorRoutes } from "./modules/collaborator/collaborator.routes";
import { documentTypeRoutes } from "./modules/document-type/document-type.routes";
import { errorHandler } from "./shared/middlewares/errorHandler";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

app.use("/collaborators", collaboratorRoutes);
app.use("/document-types", documentTypeRoutes);

app.use(errorHandler);

export { app };
