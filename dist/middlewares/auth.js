"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticarToken = autenticarToken;
const unauthorized_1 = require("@/_errors/unauthorized");
async function autenticarToken(request, reply) {
    try {
        // Verificar se o header Authorization existe
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new unauthorized_1.Unauthorized("Token de autenticação não fornecido");
        }
        // Verificar se o token está no formato correto "Bearer <token>"
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            throw new unauthorized_1.Unauthorized("Formato de token inválido. Use: Bearer <token>");
        }
        // Verificar o token JWT
        await request.jwtVerify();
        const { userId, register } = request.user;
        request.usuario = {
            id: userId,
            register: register
        };
    }
    catch (error) {
        if (error instanceof unauthorized_1.Unauthorized) {
            throw error;
        }
        // Se for erro do JWT (token inválido, expirado, etc)
        if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
            throw new unauthorized_1.Unauthorized("Token de autenticação inválido");
        }
        if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
            throw new unauthorized_1.Unauthorized("Token de autenticação expirado");
        }
        // Outros erros de JWT
        throw new unauthorized_1.Unauthorized("Falha na autenticação");
    }
}
//# sourceMappingURL=auth.js.map