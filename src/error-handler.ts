import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod/v3";
import { BadRequest } from "./_errors/bad-request";
import { NotFound } from "./_errors/not-found";
import { Unauthorized } from "./_errors/unauthorized";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Erros de validação do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      issues: error.flatten().fieldErrors
    });
  }

  // Erros de validação do Fastify Schema
  if (error.code === "FST_ERR_VALIDATION") {
    if (
      error.validationContext === "headers" &&
      String(error.message).toLowerCase().includes("authorization")
    ) {
      return reply.status(401).send({
        status: "error",
        message: "Token inválido ou não fornecido"
      });
    }
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      details: error.message
    });
  }

  // Erros de JWT
  if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
    return reply.status(401).send({
      status: "error",
      message: "Token inválido ou não fornecido"
    });
  }

  if (error.code === "FST_JWT_BAD_REQUEST") {
    return reply.status(401).send({
      status: "error",
      message: "Token inválido"
    });
  }

  // Erros customizados da aplicação
  if (error instanceof BadRequest) {
    return reply.status(400).send({
      status: "error",
      message: error.message
    });
  }

  if (error instanceof NotFound) {
    return reply.status(404).send({
      status: "error",
      message: error.message
    });
  }

  if (error instanceof Unauthorized) {
    return reply.status(401).send({
      status: "error",
      message: error.message
    });
  }

  // Log do erro para debug
  console.error("Internal server error:", error);

  return reply.status(500).send({
    status: "error",
    message: "Internal server error"
  });
}
