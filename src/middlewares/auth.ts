import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { Register } from "@prisma/client";
import { Unauthorized } from "@/_errors/unauthorized";

export async function autenticarToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o header Authorization existe
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new Unauthorized("Token de autenticação não fornecido");
    }

    // Verificar se o token está no formato correto "Bearer <token>"
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new Unauthorized("Formato de token inválido. Use: Bearer <token>");
    }

    // Verificar o token JWT
    await request.jwtVerify();

    const { userId, register } = request.user as {
      userId: string;
      register: Register;
    };

    (request as AuthenticatedRequest).usuario = {
      id: userId,
      register: register
    };
  } catch (error) {
    if (error instanceof Unauthorized) {
      throw error;
    }

    // Se for erro do JWT (token inválido, expirado, etc)
    if ((error as any).code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      throw new Unauthorized("Token de autenticação inválido");
    }

    if ((error as any).code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
      throw new Unauthorized("Token de autenticação expirado");
    }

    // Outros erros de JWT
    throw new Unauthorized("Falha na autenticação");
  }
}
