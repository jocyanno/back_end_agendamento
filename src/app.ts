import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { usuarioRoutes } from "@/routes/user/usuarioRoutes";

export function build(opts = {}): FastifyInstance {
  const app = Fastify(opts);

  // Registrar JWT
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "your-secret-key"
  });

  // Registrar rotas
  app.register(usuarioRoutes);

  return app;
}
