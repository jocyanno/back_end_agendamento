import fastify, { FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform
} from "fastify-type-provider-zod";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { errorHandler } from "../../src/error-handler";
import { usuarioRoutes } from "../../src/routes/user/usuarioRoutes";
import { appointmentRoutes } from "../../src/routes/appointment/appointmentRoutes";

export async function createTestServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false // Desabilitar logs nos testes
  });

  app.register(fastifyCors, {
    origin: "*"
  });

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "test-jwt-secret"
  });

  app.register(import("@fastify/multipart"), {
    limits: {
      fileSize: 15 * 1024 * 1024 // 15MB
    }
  });

  app.register(fastifySwagger, {
    swagger: {
      consumes: ["application/json", "multipart/form-data"],
      produces: ["application/json"],
      info: {
        title: "Test API",
        description: "API de teste para agendamentos",
        version: "1.0"
      }
    },
    transform: jsonSchemaTransform
  });

  app.register(fastifySwaggerUI, {
    routePrefix: "/docs"
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Definir error handler ANTES das rotas
  app.setErrorHandler(errorHandler);

  app.register(usuarioRoutes);
  app.register(appointmentRoutes);

  await app.ready();

  return app;
}
