import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./shared/logger";

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Servidor rodando em http://localhost:${port}`);
});
