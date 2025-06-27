import { beforeAll, afterAll } from "vitest";

beforeAll(async () => {
  // Setup básico para testes
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  // Cleanup final
});
