import { FastifyRequest } from "fastify";
import { Register } from "@prisma/client";

export interface AuthenticatedRequest extends FastifyRequest {
  usuario: {
    id: string;
    register: Register;
  };
}
