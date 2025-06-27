import { FastifyInstance } from "fastify";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Register } from "@prisma/client";
import {
  createUsuario,
  createUsuarioAdmin,
  deleteUsuario,
  getUsuario,
  loginUsuario,
  updateUsuario
} from "@/controllers/usuarioController";

export async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Registrar JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "test-secret-key"
  });

  // Registrar rotas manualmente sem schemas de validação
  app.get("/user", { preHandler: [authenticateToken] }, getUsuario);
  app.post("/user/login", loginUsuario);
  app.post("/user", createUsuario);
  app.post(
    "/user/admin",
    { preHandler: [authenticateToken] },
    createUsuarioAdmin
  );
  app.put("/user", { preHandler: [authenticateToken] }, updateUsuario);
  app.delete("/user/:id", { preHandler: [authenticateToken] }, deleteUsuario);

  return app;
}

// Middleware de autenticação simplificado para testes
async function authenticateToken(request: any, reply: any) {
  try {
    await request.jwtVerify();
    const { userId, register } = request.user as {
      userId: string;
      register: Register;
    };
    request.usuario = {
      id: userId,
      register: register
    };
  } catch (err) {
    reply.code(401).send({ status: "error", message: "Unauthorized" });
  }
}

export async function createTestUser(data: {
  email: string;
  password: string;
  cpf: string;
  register?: Register;
  name?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await prisma.users.create({
    data: {
      email: data.email,
      password: hashedPassword,
      cpf: data.cpf,
      register: data.register || "patient",
      name: data.name || "Test User"
    }
  });
}

export async function generateToken(
  app: FastifyInstance,
  userId: string,
  register: Register
) {
  return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}

export async function cleanDatabase() {
  await prisma.users.deleteMany();
}
