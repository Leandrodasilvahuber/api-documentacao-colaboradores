import express from "express";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "api-documentacao-colaboradores" });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
