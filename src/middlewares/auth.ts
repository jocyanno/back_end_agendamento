import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { Register } from "@prisma/client";

export async function autenticarToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await request.jwtVerify();

  const { userId, register } = request.user as {
    userId: string;
    register: Register;
  };

  (request as AuthenticatedRequest).usuario = {
    id: userId,
    register: register
  };
}
