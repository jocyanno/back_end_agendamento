"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const usuarioService_service_1 = require("../../service/usuarioService.service");
const prisma_1 = require("../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const bad_request_1 = require("../../_errors/bad-request");
const unauthorized_1 = require("../../_errors/unauthorized");
const not_found_1 = require("../../_errors/not-found");
// Mock completo do Prisma
vitest_1.vi.mock("@/lib/prisma", () => ({
    prisma: {
        users: {
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn()
        }
    }
}));
// Mock do bcrypt - corrigido
vitest_1.vi.mock("bcrypt", () => ({
    default: {
        compare: vitest_1.vi.fn().mockResolvedValue(true),
        hash: vitest_1.vi.fn().mockResolvedValue("hashedPassword")
    }
}));
// Mock do moment
vitest_1.vi.mock("moment-timezone", () => ({
    default: vitest_1.vi.fn(() => ({
        isValid: () => true,
        toDate: () => new Date("2024-01-01")
    }))
}));
(0, vitest_1.describe)("usuarioService", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("authenticateUser", () => {
        (0, vitest_1.it)("deve autenticar usuário com credenciais válidas", async () => {
            const mockUser = {
                id: "1",
                email: "test@test.com",
                password: "hashedPassword",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockFastify = {
                jwt: {
                    sign: vitest_1.vi.fn().mockResolvedValue("mock-token")
                }
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockUser);
            vitest_1.vi.mocked(bcrypt_1.default.compare).mockResolvedValue(true);
            const result = await (0, usuarioService_service_1.authenticateUser)("test@test.com", "password", mockFastify);
            (0, vitest_1.expect)(result).toEqual({
                token: "mock-token",
                usuario: vitest_1.expect.objectContaining({
                    id: "1",
                    email: "test@test.com",
                    register: "patient"
                })
            });
            (0, vitest_1.expect)(result.usuario).not.toHaveProperty("password");
        });
        (0, vitest_1.it)("deve lançar erro com credenciais inválidas", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, usuarioService_service_1.authenticateUser)("test@test.com", "password", {})).rejects.toThrow(unauthorized_1.Unauthorized);
        });
        (0, vitest_1.it)("deve lançar erro com senha incorreta", async () => {
            const mockUser = {
                id: "1",
                email: "test@test.com",
                password: "hashedPassword",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockUser);
            vitest_1.vi.mocked(bcrypt_1.default.compare).mockResolvedValue(false);
            await (0, vitest_1.expect)((0, usuarioService_service_1.authenticateUser)("test@test.com", "wrongpassword", {})).rejects.toThrow(unauthorized_1.Unauthorized);
        });
    });
    (0, vitest_1.describe)("createUser", () => {
        (0, vitest_1.it)("deve criar usuário com dados válidos", async () => {
            const userData = {
                email: "test@test.com",
                password: "password123",
                cpf: "12345678901",
                register: "patient",
                name: "Test User"
            };
            const mockCreatedUser = {
                id: "1",
                email: "test@test.com",
                password: "hashedPassword",
                cpf: "12345678901",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(bcrypt_1.default.hash).mockResolvedValue("hashedPassword");
            vitest_1.vi.mocked(prisma_1.prisma.users.create).mockResolvedValue(mockCreatedUser);
            const result = await (0, usuarioService_service_1.createUser)(userData);
            (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                id: "1",
                email: "test@test.com",
                register: "patient"
            }));
            (0, vitest_1.expect)(bcrypt_1.default.hash).toHaveBeenCalledWith("password123", 10);
        });
        (0, vitest_1.it)("deve impedir criação de usuário com register doctor", async () => {
            const userData = {
                email: "doctor@test.com",
                password: "password123",
                cpf: "12345678901",
                register: "doctor",
                name: "Doctor User"
            };
            await (0, vitest_1.expect)((0, usuarioService_service_1.createUser)(userData)).rejects.toThrow(bad_request_1.BadRequest);
        });
    });
    (0, vitest_1.describe)("createUserAdmin", () => {
        (0, vitest_1.it)("deve criar usuário admin com qualquer register", async () => {
            const userData = {
                email: "doctor@test.com",
                password: "password123",
                cpf: "12345678901",
                register: "doctor",
                name: "Doctor User"
            };
            const mockCreatedUser = {
                id: "1",
                email: "doctor@test.com",
                password: "hashedPassword",
                cpf: "12345678901",
                register: "doctor",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(bcrypt_1.default.hash).mockResolvedValue("hashedPassword");
            vitest_1.vi.mocked(prisma_1.prisma.users.create).mockResolvedValue(mockCreatedUser);
            const result = await (0, usuarioService_service_1.createUserAdmin)(userData);
            (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                id: "1",
                email: "doctor@test.com",
                register: "doctor"
            }));
        });
    });
    (0, vitest_1.describe)("updateUser", () => {
        (0, vitest_1.it)("deve atualizar usuário existente", async () => {
            const userId = "1";
            const updateData = {
                name: "Updated Name",
                email: "updated@test.com"
            };
            const mockExistingUser = {
                id: "1",
                email: "old@test.com",
                password: "hashedPassword",
                cpf: "12345678901",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockUpdatedUser = {
                ...mockExistingUser,
                ...updateData
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockExistingUser);
            vitest_1.vi.mocked(prisma_1.prisma.users.update).mockResolvedValue(mockUpdatedUser);
            const result = await (0, usuarioService_service_1.updateUser)(userId, updateData);
            (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                name: "Updated Name",
                email: "updated@test.com"
            }));
        });
        (0, vitest_1.it)("deve lançar erro se usuário não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, usuarioService_service_1.updateUser)("inexistent-id", { name: "Test" })).rejects.toThrow(not_found_1.NotFound);
        });
    });
    (0, vitest_1.describe)("deleteUser", () => {
        (0, vitest_1.it)("deve deletar usuário existente", async () => {
            const userId = "1";
            const adminId = "2";
            const mockUser = {
                id: "1",
                email: "user@test.com",
                password: "hashedPassword",
                cpf: "12345678901",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockUser);
            vitest_1.vi.mocked(prisma_1.prisma.users.delete).mockResolvedValue(mockUser);
            const result = await (0, usuarioService_service_1.deleteUser)(userId, adminId);
            (0, vitest_1.expect)(result).toEqual({ message: "User deleted successfully" });
            (0, vitest_1.expect)(prisma_1.prisma.users.delete).toHaveBeenCalledWith({
                where: { id: userId }
            });
        });
        (0, vitest_1.it)("deve impedir admin de deletar a si mesmo", async () => {
            const userId = "1";
            const adminId = "1";
            const mockUser = {
                id: "1",
                email: "admin@test.com",
                password: "hashedPassword",
                cpf: "12345678901",
                register: "doctor",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockUser);
            await (0, vitest_1.expect)((0, usuarioService_service_1.deleteUser)(userId, adminId)).rejects.toThrow(bad_request_1.BadRequest);
        });
        (0, vitest_1.it)("deve lançar erro se usuário não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, usuarioService_service_1.deleteUser)("inexistent-id", "admin-id")).rejects.toThrow(not_found_1.NotFound);
        });
    });
    (0, vitest_1.describe)("searchUsuario", () => {
        (0, vitest_1.it)("deve encontrar usuário por ID", async () => {
            const mockUser = {
                id: "1",
                email: "test@test.com",
                password: "hashedPassword",
                name: "Test User",
                cpf: "12345678901",
                register: "patient",
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
                cid: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(mockUser);
            const result = await (0, usuarioService_service_1.searchUsuario)("1");
            (0, vitest_1.expect)(result).toEqual(mockUser);
        });
        (0, vitest_1.it)("deve lançar erro se usuário não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, usuarioService_service_1.searchUsuario)("inexistent-id")).rejects.toThrow(not_found_1.NotFound);
        });
    });
});
//# sourceMappingURL=usuarioService.test.js.map