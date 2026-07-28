import express from "express";
import { env } from "./config/env";

const app = express();
const port = env.PORT;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
