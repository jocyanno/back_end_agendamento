import { describe, it, expect } from "vitest";
import { prismaTest } from "./setup";

describe("Test Environment Health Check", () => {
  it("should connect to test database", async () => {
    const result = await prismaTest.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it("should have correct environment variables", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.DATABASE_URL).toContain("test");
  });

  it("should be able to create and delete test data", async () => {
    // Criar usuário de teste
    const user = await prismaTest.users.create({
      data: {
        name: "Health Check User",
        email: "health@test.com",
        password: "password123",
        cpf: "99999999999",
        register: "patient"
      }
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();

    // Limpar dados de teste
    await prismaTest.users.delete({
      where: { id: user.id }
    });

    // Verificar se foi deletado
    const deletedUser = await prismaTest.users.findUnique({
      where: { id: user.id }
    });

    expect(deletedUser).toBeNull();
  });
});
