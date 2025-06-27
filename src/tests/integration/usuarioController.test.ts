import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  createUsuario,
  loginUsuario,
  getUsuario,
  updateUsuario,
  deleteUsuario,
  createUsuarioAdmin
} from "@/controllers/usuarioController";

// Mock dos serviços
vi.mock("@/service/usuarioService.service", () => ({
  authenticateUser: vi.fn(),
  createUser: vi.fn(),
  createUserAdmin: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUsuarioLogado: vi.fn(),
  getUsuarioLogadoIsAdmin: vi.fn(),
  getUserExisting: vi.fn()
}));

describe("Usuario Controller Integration", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      server: {
        jwt: {
          sign: vi.fn().mockReturnValue("mock-token")
        }
      }
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
    vi.clearAllMocks();
  });

  describe("loginUsuario", () => {
    it("deve fazer login com sucesso", async () => {
      const { authenticateUser } = await import(
        "@/service/usuarioService.service"
      );

      mockRequest.body = {
        email: "test@test.com",
        password: "password123"
      };

      vi.mocked(authenticateUser).mockResolvedValue({
        token: "mock-token",
        usuario: { id: "1", email: "test@test.com", register: "patient" }
      });

      await loginUsuario(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          token: "mock-token"
        })
      });
    });
  });

  describe("createUsuario", () => {
    it("deve criar usuário com sucesso", async () => {
      const { createUser, getUserExisting } = await import(
        "@/service/usuarioService.service"
      );

      mockRequest.body = {
        email: "new@test.com",
        password: "password123",
        cpf: "12345678901",
        name: "New User"
      };

      vi.mocked(getUserExisting).mockResolvedValue(undefined);
      vi.mocked(createUser).mockResolvedValue({
        id: "1",
        email: "new@test.com",
        register: "patient"
      });

      await createUsuario(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          token: "mock-token"
        })
      });
    });
  });

  describe("getUsuario", () => {
    it("deve retornar dados do usuário", async () => {
      const { getUsuarioLogado } = await import(
        "@/service/usuarioService.service"
      );

      vi.mocked(getUsuarioLogado).mockResolvedValue({
        id: "1",
        email: "user@test.com",
        name: "User"
      });

      await getUsuario(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          email: "user@test.com"
        })
      });
    });
  });
});
