import { beforeAll, afterAll, beforeEach } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { vi } from "vitest";
import { resetUserCounter } from "./helpers/testHelpers";

// Detectar se é teste E2E baseado no caminho do arquivo de teste
const isE2ETest =
  process.argv.some((arg) => arg.includes("e2e")) ||
  process.cwd().includes("e2e") ||
  process.env.npm_config_argv?.includes("e2e");

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = isE2ETest ? "e2e" : "test";
process.env.VITEST_MODE = isE2ETest ? "e2e" : "unit";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://agendamento:agendamento@localhost:5432/agendamento_test";
process.env.JWT_SECRET = "test-jwt-secret";

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Mock do módulo prisma para todos os testes
vi.mock("@/lib/prisma", () => ({
  prisma: prismaTest
}));

async function cleanDatabase() {
  try {
    // Limpeza simples sem tentar configurar permissões do PostgreSQL
    // Limpar em ordem reversa das dependências
    await prismaTest.notification.deleteMany();
    await prismaTest.appointment.deleteMany();
    await prismaTest.availability.deleteMany();
    await prismaTest.users.deleteMany();

    // Resetar contadores
    resetUserCounter();

    // Aguardar um pouco para garantir que as operações sejam concluídas
    await new Promise((resolve) => setTimeout(resolve, 50));
  } catch (error) {
    console.error("Error cleaning database:", error);
    // Em caso de erro, tentar uma limpeza mais agressiva
    try {
      // Tentar limpeza individual de cada tabela
      await prismaTest.$executeRaw`DELETE FROM "notifications"`;
      await prismaTest.$executeRaw`DELETE FROM "appointments"`;
      await prismaTest.$executeRaw`DELETE FROM "availabilities"`;
      await prismaTest.$executeRaw`DELETE FROM "users"`;
      resetUserCounter();
    } catch (fallbackError) {
      console.error("Fallback cleanup also failed:", fallbackError);
    }
  }
}

beforeAll(async () => {
  try {
    execSync("npx prisma migrate deploy", { stdio: "ignore" });
    await cleanDatabase();
  } catch (error) {
    console.error("Setup error:", error);
  }
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prismaTest.$disconnect();
});
