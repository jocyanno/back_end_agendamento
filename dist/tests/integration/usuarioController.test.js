"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const usuarioController_1 = require("../../controllers/usuarioController");
// Mock dos serviços
vitest_1.vi.mock("@/service/usuarioService.service", () => ({
    authenticateUser: vitest_1.vi.fn(),
    createUser: vitest_1.vi.fn(),
    createUserAdmin: vitest_1.vi.fn(),
    updateUser: vitest_1.vi.fn(),
    deleteUser: vitest_1.vi.fn(),
    getUsuarioLogado: vitest_1.vi.fn(),
    getUsuarioLogadoIsAdmin: vitest_1.vi.fn(),
    getUserExisting: vitest_1.vi.fn()
}));
(0, vitest_1.describe)("Usuario Controller Integration", () => {
    let mockRequest;
    let mockReply;
    (0, vitest_1.beforeEach)(() => {
        mockRequest = {
            body: {},
            params: {},
            server: {
                jwt: {
                    sign: vitest_1.vi.fn().mockReturnValue("mock-token")
                }
            }
        };
        mockReply = {
            status: vitest_1.vi.fn().mockReturnThis(),
            code: vitest_1.vi.fn().mockReturnThis(),
            send: vitest_1.vi.fn().mockReturnThis()
        };
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("loginUsuario", () => {
        (0, vitest_1.it)("deve fazer login com sucesso", async () => {
            const { authenticateUser } = await Promise.resolve().then(() => __importStar(require("../../service/usuarioService.service")));
            mockRequest.body = {
                email: "test@test.com",
                password: "password123"
            };
            vitest_1.vi.mocked(authenticateUser).mockResolvedValue({
                token: "mock-token",
                usuario: { id: "1", email: "test@test.com", register: "patient" }
            });
            await (0, usuarioController_1.loginUsuario)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: vitest_1.expect.objectContaining({
                    token: "mock-token"
                })
            });
        });
    });
    (0, vitest_1.describe)("createUsuario", () => {
        (0, vitest_1.it)("deve criar usuário com sucesso", async () => {
            const { createUser, getUserExisting } = await Promise.resolve().then(() => __importStar(require("../../service/usuarioService.service")));
            mockRequest.body = {
                email: "new@test.com",
                password: "password123",
                cpf: "12345678901",
                name: "New User"
            };
            vitest_1.vi.mocked(getUserExisting).mockResolvedValue(undefined);
            vitest_1.vi.mocked(createUser).mockResolvedValue({
                id: "1",
                email: "new@test.com",
                register: "patient"
            });
            await (0, usuarioController_1.createUsuario)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: vitest_1.expect.objectContaining({
                    token: "mock-token"
                })
            });
        });
    });
    (0, vitest_1.describe)("getUsuario", () => {
        (0, vitest_1.it)("deve retornar dados do usuário", async () => {
            const { getUsuarioLogado } = await Promise.resolve().then(() => __importStar(require("../../service/usuarioService.service")));
            vitest_1.vi.mocked(getUsuarioLogado).mockResolvedValue({
                id: "1",
                email: "user@test.com",
                name: "User"
            });
            await (0, usuarioController_1.getUsuario)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: vitest_1.expect.objectContaining({
                    email: "user@test.com"
                })
            });
        });
    });
});
//# sourceMappingURL=usuarioController.test.js.map