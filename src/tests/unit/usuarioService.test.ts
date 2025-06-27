import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  authenticateUser,
  createUser,
  createUserAdmin,
  updateUser,
  deleteUser,
  getUserById,
  searchUsuario
} from "@/service/usuarioService.service";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { BadRequest } from "@/_errors/bad-request";
import { Unauthorized } from "@/_errors/unauthorized";
import { NotFound } from "@/_errors/not-found";

// Mock completo do Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock do bcrypt - corrigido
vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}));

// Mock do moment
vi.mock("moment-timezone", () => ({
  default: vi.fn(() => ({
    isValid: () => true,
    toDate: () => new Date("2024-01-01")
  }))
}));

describe("usuarioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticateUser", () => {
    it("deve autenticar usuário com credenciais válidas", async () => {
      const mockUser = {
        id: "1",
        email: "test@test.com",
        password: "hashedPassword",
        register: "patient" as const,
        name: "Test User",
        cpf: "12345678901",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockFastify = {
        jwt: {
          sign: vi.fn().mockResolvedValue("mock-token")
        }
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await authenticateUser(
        "test@test.com",
        "password",
        mockFastify
      );

      expect(result).toEqual({
        token: "mock-token",
        usuario: expect.objectContaining({
          id: "1",
          email: "test@test.com",
          register: "patient"
        })
      });
      expect(result.usuario).not.toHaveProperty("password");
    });

    it("deve lançar erro com credenciais inválidas", async () => {
      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      await expect(
        authenticateUser("test@test.com", "password", {})
      ).rejects.toThrow(Unauthorized);
    });

    it("deve lançar erro com senha incorreta", async () => {
      const mockUser = {
        id: "1",
        email: "test@test.com",
        password: "hashedPassword",
        register: "patient" as const,
        name: "Test User",
        cpf: "12345678901",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(
        authenticateUser("test@test.com", "wrongpassword", {})
      ).rejects.toThrow(Unauthorized);
    });
  });

  describe("createUser", () => {
    it("deve criar usuário com dados válidos", async () => {
      const userData = {
        email: "test@test.com",
        password: "password123",
        cpf: "12345678901",
        register: "patient" as const,
        name: "Test User"
      };

      const mockCreatedUser = {
        id: "1",
        email: "test@test.com",
        cpf: "12345678901",
        register: "patient" as const,
        name: "Test User",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword");
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser);

      const result = await createUser(userData);

      expect(result).toEqual(
        expect.objectContaining({
          id: "1",
          email: "test@test.com",
          register: "patient"
        })
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });

    it("deve impedir criação de usuário com register doctor", async () => {
      const userData = {
        email: "doctor@test.com",
        password: "password123",
        cpf: "12345678901",
        register: "doctor" as const,
        name: "Doctor User"
      };

      await expect(createUser(userData)).rejects.toThrow(BadRequest);
    });
  });

  describe("createUserAdmin", () => {
    it("deve criar usuário admin com qualquer register", async () => {
      const userData = {
        email: "doctor@test.com",
        password: "password123",
        cpf: "12345678901",
        register: "doctor" as const,
        name: "Doctor User"
      };

      const mockCreatedUser = {
        id: "1",
        email: "doctor@test.com",
        cpf: "12345678901",
        register: "doctor" as const,
        name: "Doctor User",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword");
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser);

      const result = await createUserAdmin(userData);

      expect(result).toEqual(
        expect.objectContaining({
          id: "1",
          email: "doctor@test.com",
          register: "doctor"
        })
      );
    });
  });

  describe("updateUser", () => {
    it("deve atualizar usuário existente", async () => {
      const userId = "1";
      const updateData = {
        name: "Updated Name",
        email: "updated@test.com"
      };

      const mockExistingUser = {
        id: "1",
        email: "old@test.com",
        cpf: "12345678901",
        register: "patient" as const,
        name: "Old Name",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        ...updateData
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockExistingUser);
      vi.mocked(prisma.users.update).mockResolvedValue(mockUpdatedUser);

      const result = await updateUser(userId, updateData);

      expect(result).toEqual(
        expect.objectContaining({
          name: "Updated Name",
          email: "updated@test.com"
        })
      );
    });

    it("deve lançar erro se usuário não existir", async () => {
      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      await expect(
        updateUser("inexistent-id", { name: "Test" })
      ).rejects.toThrow(NotFound);
    });
  });

  describe("deleteUser", () => {
    it("deve deletar usuário existente", async () => {
      const userId = "1";
      const adminId = "2";

      const mockUser = {
        id: "1",
        email: "user@test.com",
        cpf: "12345678901",
        register: "patient" as const,
        name: "User",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.users.delete).mockResolvedValue(mockUser);

      const result = await deleteUser(userId, adminId);

      expect(result).toEqual({ message: "User deleted successfully" });
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it("deve impedir admin de deletar a si mesmo", async () => {
      const userId = "1";
      const adminId = "1";

      const mockUser = {
        id: "1",
        email: "admin@test.com",
        cpf: "12345678901",
        register: "doctor" as const,
        name: "Admin",
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser);

      await expect(deleteUser(userId, adminId)).rejects.toThrow(BadRequest);
    });

    it("deve lançar erro se usuário não existir", async () => {
      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      await expect(deleteUser("inexistent-id", "admin-id")).rejects.toThrow(
        NotFound
      );
    });
  });

  describe("searchUsuario", () => {
    it("deve encontrar usuário por ID", async () => {
      const mockUser = {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        cpf: "12345678901",
        register: "patient" as const,
        image: null,
        birthDate: null,
        phone: null,
        address: null,
        numberOfAddress: null,
        complement: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser);

      const result = await searchUsuario("1");

      expect(result).toEqual(mockUser);
    });

    it("deve lançar erro se usuário não existir", async () => {
      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      await expect(searchUsuario("inexistent-id")).rejects.toThrow(NotFound);
    });
  });
});
