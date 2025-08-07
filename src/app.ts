import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { usuarioRoutes } from "@/routes/user/usuarioRoutes";
import { organizationRoutes } from "@/routes/organization/organizationRoutes";

export function build(opts = {}): FastifyInstance {
  const app = Fastify(opts);

  // Registrar JWT
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "your-secret-key"
  });

  // Registrar rotas
  app.register(usuarioRoutes);
  app.register(organizationRoutes);

  return app;
}
