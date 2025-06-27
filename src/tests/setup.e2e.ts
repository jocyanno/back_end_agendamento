import { beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

beforeAll(async () => {
  // Usar SQLite para testes E2E
  const testDbPath = path.join(process.cwd(), "test.db");
  process.env.DATABASE_URL = `file:${testDbPath}`;

  // Remover banco anterior se existir
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  try {
    // Aplicar schema usando db push
    execSync("npx prisma db push --force-reset --skip-generate", {
      stdio: "ignore",
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` }
    });
  } catch (error) {
    console.warn(
      "Aviso: Não foi possível configurar banco de teste automaticamente"
    );
  }
});

afterAll(async () => {
  // Remover banco de teste
  const testDbPath = path.join(process.cwd(), "test.db");
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // Ignorar erro se não conseguir deletar
    }
  }
});
