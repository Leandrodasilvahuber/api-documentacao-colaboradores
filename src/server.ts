import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./shared/logger";
import { prisma } from "./shared/database/prisma";

const port = env.PORT;

const server = app.listen(port, () => {
  logger.info(`Servidor rodando em http://localhost:${port}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} recebido, encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
