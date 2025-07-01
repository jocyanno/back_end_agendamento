"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_1 = require("../../middlewares/auth");
(0, vitest_1.describe)("Auth Middleware", () => {
    let mockRequest;
    let mockReply;
    (0, vitest_1.beforeEach)(() => {
        mockRequest = {
            jwtVerify: vitest_1.vi.fn().mockResolvedValue(undefined),
            user: { userId: "user-id", register: "patient" },
            headers: {
                authorization: "Bearer valid-token"
            }
        };
        mockReply = {};
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("deve autenticar token válido", async () => {
        await (0, auth_1.autenticarToken)(mockRequest, mockReply);
        (0, vitest_1.expect)(mockRequest.jwtVerify).toHaveBeenCalled();
        (0, vitest_1.expect)(mockRequest.usuario).toEqual({
            id: "user-id",
            register: "patient"
        });
    });
    (0, vitest_1.it)("deve falhar com token inválido", async () => {
        vitest_1.vi.mocked(mockRequest.jwtVerify).mockRejectedValue({
            code: "FST_JWT_AUTHORIZATION_TOKEN_INVALID"
        });
        await (0, vitest_1.expect)((0, auth_1.autenticarToken)(mockRequest, mockReply)).rejects.toThrow("Token de autenticação inválido");
    });
    (0, vitest_1.it)("deve falhar sem header Authorization", async () => {
        mockRequest.headers = {};
        await (0, vitest_1.expect)((0, auth_1.autenticarToken)(mockRequest, mockReply)).rejects.toThrow("Token de autenticação não fornecido");
    });
    (0, vitest_1.it)("deve falhar com formato de token incorreto", async () => {
        mockRequest.headers = {
            authorization: "InvalidFormat token"
        };
        await (0, vitest_1.expect)((0, auth_1.autenticarToken)(mockRequest, mockReply)).rejects.toThrow("Formato de token inválido. Use: Bearer <token>");
    });
    (0, vitest_1.it)("deve falhar com token expirado", async () => {
        vitest_1.vi.mocked(mockRequest.jwtVerify).mockRejectedValue({
            code: "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
        });
        await (0, vitest_1.expect)((0, auth_1.autenticarToken)(mockRequest, mockReply)).rejects.toThrow("Token de autenticação expirado");
    });
});
//# sourceMappingURL=auth.test.js.map