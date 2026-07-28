import express from "express";
import { collaboratorRoutes } from "./modules/collaborator/collaborator.routes";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

app.use("/collaborators", collaboratorRoutes);

export { app };
