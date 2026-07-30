import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

export default async function globalSetup(): Promise<void> {
  dotenv.config({ path: path.resolve(__dirname, "../../.env.test"), quiet: true });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL não definido para os testes e2e — copie .env.test.example para .env.test",
    );
  }

  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, "");

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const adminClient = new Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();
  try {
    const { rowCount } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      databaseName,
    ]);
    if (rowCount === 0) {
      // databaseName vem do DATABASE_URL do .env.test local, não de input externo/usuário;
      // identificadores de banco não são parametrizáveis via placeholders do driver pg.
      // eslint-disable-next-line sonarjs/sql-queries
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await adminClient.end();
  }

  // Comando fixo (sem input externo), só para preparar o banco de teste local.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}
