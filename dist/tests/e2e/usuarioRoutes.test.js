"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const prisma_1 = require("../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const usuarioController_1 = require("../../controllers/usuarioController");
const unauthorized_1 = require("../../_errors/unauthorized");
const bad_request_1 = require("../../_errors/bad-request");
const not_found_1 = require("../../_errors/not-found");
async function createTestApp() {
    const app = (0, fastify_1.default)({ logger: false });
    // Registrar JWT
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "test-secret-key"
    });
    // Tratamento de erro global
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof unauthorized_1.Unauthorized) {
            return reply.code(401).send({ status: "error", message: error.message });
        }
        if (error instanceof bad_request_1.BadRequest) {
            return reply.code(400).send({ status: "error", message: error.message });
        }
        if (error instanceof not_found_1.NotFound) {
            return reply.code(404).send({ status: "error", message: error.message });
        }
        // Erro genérico
        return reply.code(500).send({
            status: "error",
            message: "Internal server error"
        });
    });
    // Middleware de autenticação
    const authenticateMiddleware = async (request, reply) => {
        try {
            await request.jwtVerify();
            const { userId, register } = request.user;
            request.usuario = { id: userId, register };
        }
        catch (err) {
            throw new unauthorized_1.Unauthorized("Token inválido");
        }
    };
    // Registrar rotas
    app.post("/user/login", async (request, reply) => {
        return await (0, usuarioController_1.loginUsuario)(request, reply);
    });
    app.post("/user", async (request, reply) => {
        return await (0, usuarioController_1.createUsuario)(request, reply);
    });
    app.get("/user", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, usuarioController_1.getUsuario)(request, reply);
    });
    app.put("/user", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, usuarioController_1.updateUsuario)(request, reply);
    });
    app.post("/user/admin", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, usuarioController_1.createUsuarioAdmin)(request, reply);
    });
    app.delete("/user/:id", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, usuarioController_1.deleteUsuario)(request, reply);
    });
    return app;
}
async function createTestUser(data) {
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    // Primeiro, deletar se já existir para evitar conflitos
    await prisma_1.prisma.users.deleteMany({
        where: {
            OR: [{ email: data.email }, { cpf: data.cpf }]
        }
    });
    return await prisma_1.prisma.users.create({
        data: {
            email: data.email,
            password: hashedPassword,
            cpf: data.cpf,
            register: data.register || "patient",
            name: data.name || "Test User"
        }
    });
}
async function generateToken(app, userId, register) {
    return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}
async function cleanDatabase() {
    // Deletar na ordem correta para respeitar as foreign keys
    await prisma_1.prisma.notification.deleteMany();
    await prisma_1.prisma.appointment.deleteMany();
    await prisma_1.prisma.availability.deleteMany();
    await prisma_1.prisma.users.deleteMany();
}
(0, vitest_1.describe)("Usuario Routes E2E", () => {
    let app;
    (0, vitest_1.beforeAll)(async () => {
        app = await createTestApp();
        await app.ready();
    });
    (0, vitest_1.afterAll)(async () => {
        await app.close();
    });
    (0, vitest_1.beforeEach)(async () => {
        await cleanDatabase();
    });
    (0, vitest_1.describe)("POST /user/login", () => {
        (0, vitest_1.it)("deve fazer login com credenciais válidas", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveProperty("token");
            (0, vitest_1.expect)(body.data).toHaveProperty("usuario");
            (0, vitest_1.expect)(body.data.usuario.email).toBe("user@test.com");
        });
        (0, vitest_1.it)("deve retornar erro com credenciais inválidas", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/user/login",
                payload: {
                    email: "nonexistent@test.com",
                    password: "wrongpassword"
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
    (0, vitest_1.describe)("POST /user", () => {
        (0, vitest_1.it)("deve criar novo usuário com dados válidos", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveProperty("token");
            (0, vitest_1.expect)(body.data.usuario.email).toBe("newuser@test.com");
            (0, vitest_1.expect)(body.data.usuario.register).toBe("patient");
        });
        (0, vitest_1.it)("deve retornar erro com email duplicado", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
    (0, vitest_1.describe)("GET /user", () => {
        (0, vitest_1.it)("deve retornar dados do usuário logado", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data.email).toBe("user@test.com");
            (0, vitest_1.expect)(body.data).not.toHaveProperty("password");
        });
        (0, vitest_1.it)("deve retornar erro sem token", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/user"
            });
            (0, vitest_1.expect)(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
    (0, vitest_1.describe)("PUT /user", () => {
        (0, vitest_1.it)("deve atualizar dados do usuário logado", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.data.name).toBe("Updated Name");
            (0, vitest_1.expect)(body.data.phone).toBe("11999999999");
        });
        (0, vitest_1.it)("deve retornar erro sem token", async () => {
            const response = await app.inject({
                method: "PUT",
                url: "/user",
                payload: { name: "Test" }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(401);
        });
    });
    (0, vitest_1.describe)("POST /user/admin", () => {
        (0, vitest_1.it)("deve permitir doctor criar usuário", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.data.usuario.register).toBe("doctor");
        });
        (0, vitest_1.it)("deve impedir usuário patient de criar usuário", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
    (0, vitest_1.describe)("DELETE /user/:id", () => {
        (0, vitest_1.it)("deve permitir doctor deletar usuário", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.data.message).toBe("User deleted successfully");
        });
        (0, vitest_1.it)("deve impedir usuário patient de deletar", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
        (0, vitest_1.it)("deve impedir admin de deletar a si mesmo", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
        (0, vitest_1.it)("deve retornar erro ao deletar usuário inexistente", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
});
//# sourceMappingURL=usuarioRoutes.test.js.map