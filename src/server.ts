import { app } from "./app";
import { env } from "./config/env";

const port = env.PORT;

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
