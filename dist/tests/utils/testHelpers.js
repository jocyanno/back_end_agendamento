"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
exports.createTestUser = createTestUser;
exports.generateToken = generateToken;
exports.cleanDatabase = cleanDatabase;
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const prisma_1 = require("../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const usuarioController_1 = require("../../controllers/usuarioController");
async function createTestApp() {
    const app = (0, fastify_1.default)({ logger: false });
    // Registrar JWT
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "test-secret-key"
    });
    // Registrar rotas manualmente sem schemas de validação
    app.get("/user", { preHandler: [authenticateToken] }, usuarioController_1.getUsuario);
    app.post("/user/login", usuarioController_1.loginUsuario);
    app.post("/user", usuarioController_1.createUsuario);
    app.post("/user/admin", { preHandler: [authenticateToken] }, usuarioController_1.createUsuarioAdmin);
    app.put("/user", { preHandler: [authenticateToken] }, usuarioController_1.updateUsuario);
    app.delete("/user/:id", { preHandler: [authenticateToken] }, usuarioController_1.deleteUsuario);
    return app;
}
// Middleware de autenticação simplificado para testes
async function authenticateToken(request, reply) {
    try {
        await request.jwtVerify();
        const { userId, register } = request.user;
        request.usuario = {
            id: userId,
            register: register
        };
    }
    catch (err) {
        reply.code(401).send({ status: "error", message: "Unauthorized" });
    }
}
async function createTestUser(data) {
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
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
    await prisma_1.prisma.users.deleteMany();
}
//# sourceMappingURL=testHelpers.js.map