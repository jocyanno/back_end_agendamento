import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createUser,
  createUserAdmin,
  getUserExisting,
  updateUser,
  deleteUser,
  searchUsuario,
  selectUsuario
} from "@/service/usuarioService.service";
import {
  createTestUser,
  createTestDoctor,
  getRandomEmail,
  getRandomCPF
} from "../helpers/testHelpers";
import { BadRequest } from "../../src/_errors/bad-request";
import { NotFound } from "../../src/_errors/not-found";
import { prismaTest } from "../setup";

describe("UsuarioService", () => {
  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "patient" as const
      };

      const user = await createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.name).toBe(userData.name);
      expect(user.register).toBe("patient");
      expect(user.password).toBeUndefined(); // Não deve retornar a senha
    });

    it("should not allow creating doctor via createUser", async () => {
      const userData = {
        name: "Dr. Test",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "doctor" as const
      };

      await expect(createUser(userData)).rejects.toThrow(BadRequest);
    });

    it("should hash the password", async () => {
      const userData = {
        name: "Test User",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "patient" as const
      };

      const user = await createUser(userData);

      // Verificar que a senha foi hasheada (não é igual à original)
      expect(user.password).not.toBe(userData.password);
    });
  });

  describe("createUserAdmin", () => {
    it("should allow admin to create doctor", async () => {
      const userData = {
        name: "Dr. Admin Created",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "doctor" as const
      };

      const user = await createUserAdmin(userData);

      expect(user).toBeDefined();
      expect(user.register).toBe("doctor");
    });
  });

  describe("getUserExisting", () => {
    it("should throw error if user with email already exists", async () => {
      const existingUser = await createTestUser({
        email: "existing@test.com",
        password: "12345678",
        cpf: getRandomCPF()
      });

      await expect(
        getUserExisting({ email: existingUser.email })
      ).rejects.toThrow(BadRequest);
    });

    it("should throw error if user with CPF already exists", async () => {
      const existingUser = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: "12345678901"
      });

      await expect(getUserExisting({ cpf: existingUser.cpf })).rejects.toThrow(
        BadRequest
      );
    });

    it("should not throw error if user does not exist", async () => {
      await expect(
        getUserExisting({
          email: getRandomEmail(),
          cpf: getRandomCPF()
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const updatedData = {
        name: "Updated Name",
        phone: "+5511999999999"
      };

      const updatedUser = await updateUser(user.id, updatedData);

      expect(updatedUser.name).toBe(updatedData.name);
      expect(updatedUser.phone).toBe(updatedData.phone);
    });

    it("should throw error if user not found", async () => {
      await expect(
        updateUser("nonexistent-id", { name: "Test" })
      ).rejects.toThrow(NotFound);
    });

    it("should prevent updating to existing email", async () => {
      const user1 = await createTestUser({
        email: "user1@test.com",
        password: "12345678",
        cpf: getRandomCPF()
      });

      const user2 = await createTestUser({
        email: "user2@test.com",
        password: "12345678",
        cpf: getRandomCPF()
      });

      await expect(
        updateUser(user2.id, { email: user1.email })
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const admin = await createTestDoctor();
      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const result = await deleteUser(user.id, admin.id);

      expect(result.message).toBe("User deleted successfully");

      // Verificar que o usuário foi deletado
      await expect(searchUsuario(user.id)).rejects.toThrow(NotFound);
    });

    it("should not allow admin to delete themselves", async () => {
      const admin = await createTestDoctor();

      await expect(deleteUser(admin.id, admin.id)).rejects.toThrow(BadRequest);
    });

    it("should throw error if user to delete not found", async () => {
      const admin = await createTestDoctor();

      await expect(deleteUser("nonexistent-id", admin.id)).rejects.toThrow(
        NotFound
      );
    });
  });

  describe("searchUsuario", () => {
    it("should find existing user", async () => {
      const user = await createTestUser();

      // Usar prismaTest para garantir consistência no ambiente de teste
      const foundUser = await prismaTest.users.findUnique({
        where: { id: user.id },
        select: selectUsuario
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(user.id);
      expect(foundUser.email).toBe(user.email);
    });

    it("should throw error if user not found", async () => {
      await expect(searchUsuario("nonexistent-id")).rejects.toThrow(NotFound);
    });
  });
});
