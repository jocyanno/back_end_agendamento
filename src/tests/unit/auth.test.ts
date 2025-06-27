import { describe, it, expect, vi, beforeEach } from "vitest";
import { autenticarToken } from "@/middlewares/auth";
import { FastifyRequest, FastifyReply } from "fastify";

describe("Auth Middleware", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      jwtVerify: vi.fn().mockResolvedValue(undefined),
      user: { userId: "user-id", register: "patient" }
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
    vi.mocked(mockRequest.jwtVerify!).mockRejectedValue(
      new Error("Invalid token")
    );

    await expect(
      autenticarToken(mockRequest as FastifyRequest, mockReply as FastifyReply)
    ).rejects.toThrow("Invalid token");
  });
});
