import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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
import { Unauthorized } from "@/_errors/unauthorized";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";

async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Registrar JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "test-secret-key"
  });

  // Tratamento de erro global
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Unauthorized) {
      return reply.code(401).send({ status: "error", message: error.message });
    }
    if (error instanceof BadRequest) {
      return reply.code(400).send({ status: "error", message: error.message });
    }
    if (error instanceof NotFound) {
      return reply.code(404).send({ status: "error", message: error.message });
    }

    // Erro genérico
    return reply.code(500).send({
      status: "error",
      message: "Internal server error"
    });
  });

  // Middleware de autenticação
  const authenticateMiddleware = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
      const { userId, register } = request.user;
      request.usuario = { id: userId, register };
    } catch (err) {
      throw new Unauthorized("Token inválido");
    }
  };

  // Registrar rotas
  app.post("/user/login", async (request, reply) => {
    return await loginUsuario(request, reply);
  });

  app.post("/user", async (request, reply) => {
    return await createUsuario(request, reply);
  });

  app.get(
    "/user",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await getUsuario(request, reply);
    }
  );

  app.put(
    "/user",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await updateUsuario(request, reply);
    }
  );

  app.post(
    "/user/admin",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await createUsuarioAdmin(request, reply);
    }
  );

  app.delete(
    "/user/:id",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await deleteUsuario(request, reply);
    }
  );

  return app;
}

async function createTestUser(data: {
  email: string;
  password: string;
  cpf: string;
  register?: Register;
  name?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Primeiro, deletar se já existir para evitar conflitos
  await prisma.users.deleteMany({
    where: {
      OR: [{ email: data.email }, { cpf: data.cpf }]
    }
  });

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

async function generateToken(
  app: FastifyInstance,
  userId: string,
  register: Register
) {
  return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}

async function cleanDatabase() {
  // Deletar na ordem correta para respeitar as foreign keys
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.users.deleteMany();
}

describe("Usuario Routes E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /user/login", () => {
    it("deve fazer login com credenciais válidas", async () => {
      await createTestUser({
        email: "user@test.com",
        password: "user123456",
        cpf: "22222222222",
        register: "patient",
        name: "Regular User"
      });

      const response = await app.inject({
        method: "POST",
        url: "/user/login",
        payload: {
          email: "user@test.com",
          password: "user123456"
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveProperty("token");
      expect(body.data).toHaveProperty("usuario");
      expect(body.data.usuario.email).toBe("user@test.com");
    });

    it("deve retornar erro com credenciais inválidas", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/user/login",
        payload: {
          email: "nonexistent@test.com",
          password: "wrongpassword"
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });

  describe("POST /user", () => {
    it("deve criar novo usuário com dados válidos", async () => {
      const userData = {
        email: "newuser@test.com",
        password: "password123",
        cpf: "33333333333",
        name: "New User",
        register: "patient"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: userData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveProperty("token");
      expect(body.data.usuario.email).toBe("newuser@test.com");
      expect(body.data.usuario.register).toBe("patient");
    });

    it("deve retornar erro com email duplicado", async () => {
      await createTestUser({
        email: "duplicate@test.com",
        password: "password123",
        cpf: "44444444444",
        register: "patient"
      });

      const userData = {
        email: "duplicate@test.com",
        password: "password123",
        cpf: "55555555555",
        name: "Duplicate User",
        register: "patient"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: userData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });

  describe("GET /user", () => {
    it("deve retornar dados do usuário logado", async () => {
      const user = await createTestUser({
        email: "user@test.com",
        password: "user123456",
        cpf: "22222222222",
        register: "patient",
        name: "Regular User"
      });

      const token = await generateToken(app, user.id, user.register);

      const response = await app.inject({
        method: "GET",
        url: "/user",
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.email).toBe("user@test.com");
      expect(body.data).not.toHaveProperty("password");
    });

    it("deve retornar erro sem token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/user"
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });

  describe("PUT /user", () => {
    it("deve atualizar dados do usuário logado", async () => {
      const user = await createTestUser({
        email: "user@test.com",
        password: "user123456",
        cpf: "22222222222",
        register: "patient",
        name: "Original Name"
      });

      const token = await generateToken(app, user.id, user.register);

      const updateData = {
        name: "Updated Name",
        phone: "11999999999"
      };

      const response = await app.inject({
        method: "PUT",
        url: "/user",
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe("Updated Name");
      expect(body.data.phone).toBe("11999999999");
    });

    it("deve retornar erro sem token", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/user",
        payload: { name: "Test" }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /user/admin", () => {
    it("deve permitir doctor criar usuário", async () => {
      const admin = await createTestUser({
        email: "admin@test.com",
        password: "admin123456",
        cpf: "11111111111",
        register: "doctor",
        name: "Admin User"
      });

      const adminToken = await generateToken(app, admin.id, admin.register);

      const userData = {
        email: "newdoctor@test.com",
        password: "password123",
        cpf: "66666666666",
        name: "New Doctor",
        register: "doctor"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user/admin",
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: userData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.usuario.register).toBe("doctor");
    });

    it("deve impedir usuário patient de criar usuário", async () => {
      const user = await createTestUser({
        email: "user@test.com",
        password: "user123456",
        cpf: "22222222222",
        register: "patient"
      });

      const userToken = await generateToken(app, user.id, user.register);

      const userData = {
        email: "unauthorized@test.com",
        password: "password123",
        cpf: "77777777777",
        name: "Unauthorized User"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user/admin",
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: userData
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });

  describe("DELETE /user/:id", () => {
    it("deve permitir doctor deletar usuário", async () => {
      const admin = await createTestUser({
        email: "admin@test.com",
        password: "admin123456",
        cpf: "11111111111",
        register: "doctor"
      });

      const userToDelete = await createTestUser({
        email: "todelete@test.com",
        password: "password123",
        cpf: "99999999999",
        register: "patient"
      });

      const adminToken = await generateToken(app, admin.id, admin.register);

      const response = await app.inject({
        method: "DELETE",
        url: `/user/${userToDelete.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.message).toBe("User deleted successfully");
    });

    it("deve impedir usuário patient de deletar", async () => {
      const user = await createTestUser({
        email: "user@test.com",
        password: "user123456",
        cpf: "22222222222",
        register: "patient"
      });

      const userToken = await generateToken(app, user.id, user.register);

      const response = await app.inject({
        method: "DELETE",
        url: "/user/some-id",
        headers: {
          authorization: `Bearer ${userToken}`
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });

    it("deve impedir admin de deletar a si mesmo", async () => {
      const admin = await createTestUser({
        email: "admin@test.com",
        password: "admin123456",
        cpf: "11111111111",
        register: "doctor"
      });

      const adminToken = await generateToken(app, admin.id, admin.register);

      const response = await app.inject({
        method: "DELETE",
        url: `/user/${admin.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });

    it("deve retornar erro ao deletar usuário inexistente", async () => {
      const admin = await createTestUser({
        email: "admin@test.com",
        password: "admin123456",
        cpf: "11111111111",
        register: "doctor"
      });

      const adminToken = await generateToken(app, admin.id, admin.register);

      const response = await app.inject({
        method: "DELETE",
        url: "/user/inexistent-id",
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });
});
