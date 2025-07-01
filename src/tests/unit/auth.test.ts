import { describe, it, expect, vi, beforeEach } from "vitest";
import { autenticarToken } from "@/middlewares/auth";
import { FastifyRequest, FastifyReply } from "fastify";

describe("Auth Middleware", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      jwtVerify: vi.fn().mockResolvedValue(undefined),
      user: { userId: "user-id", register: "patient" },
      headers: {
        authorization: "Bearer valid-token"
      }
    };
    mockReply = {};
    vi.clearAllMocks();
  });

  it("deve autenticar token válido", async () => {
    await autenticarToken(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockRequest.jwtVerify).toHaveBeenCalled();
    expect((mockRequest as any).usuario).toEqual({
      id: "user-id",
      register: "patient"
    });
  });

  it("deve falhar com token inválido", async () => {
    vi.mocked(mockRequest.jwtVerify!).mockRejectedValue({
      code: "FST_JWT_AUTHORIZATION_TOKEN_INVALID"
    });

    await expect(
      autenticarToken(mockRequest as FastifyRequest, mockReply as FastifyReply)
    ).rejects.toThrow("Token de autenticação inválido");
  });

  it("deve falhar sem header Authorization", async () => {
    mockRequest.headers = {};

    await expect(
      autenticarToken(mockRequest as FastifyRequest, mockReply as FastifyReply)
    ).rejects.toThrow("Token de autenticação não fornecido");
  });

  it("deve falhar com formato de token incorreto", async () => {
    mockRequest.headers = {
      authorization: "InvalidFormat token"
    };

    await expect(
      autenticarToken(mockRequest as FastifyRequest, mockReply as FastifyReply)
    ).rejects.toThrow("Formato de token inválido. Use: Bearer <token>");
  });

  it("deve falhar com token expirado", async () => {
    vi.mocked(mockRequest.jwtVerify!).mockRejectedValue({
      code: "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
    });

    await expect(
      autenticarToken(mockRequest as FastifyRequest, mockReply as FastifyReply)
    ).rejects.toThrow("Token de autenticação expirado");
  });
});
