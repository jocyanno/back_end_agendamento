"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const usuarioRoutes_1 = require("@/routes/user/usuarioRoutes");
function build(opts = {}) {
    const app = (0, fastify_1.default)(opts);
    // Registrar JWT
    app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "your-secret-key"
    });
    // Registrar rotas
    app.register(usuarioRoutes_1.usuarioRoutes);
    return app;
}
//# sourceMappingURL=app.js.map