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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const error_handler_1 = require("./error-handler");
const usuarioRoutes_1 = require("./routes/user/usuarioRoutes");
const appointmentRoutes_1 = require("./routes/appointment/appointmentRoutes");
const attendanceRoutes_1 = require("./routes/attendance/attendanceRoutes");
const app = (0, fastify_1.default)({
    logger: false,
    serializerOpts: {
        rounding: "floor"
    },
    // Configuração para lidar com content-type e body
    bodyLimit: 1048576, // 1MB
    trustProxy: true
});
app.register(cors_1.default, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
});
app.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || "your-secret-key"
});
app.register(Promise.resolve().then(() => __importStar(require("@fastify/multipart"))), {
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB
    }
});
app.register(swagger_1.default, {
    swagger: {
        consumes: ["application/json", "multipart/form-data"],
        produces: ["application/json"],
        info: {
            title: "pass.in",
            description: "Especificações da API para o back-end da aplicação Agendamento",
            version: "1/"
        }
    },
    transform: fastify_type_provider_zod_1.jsonSchemaTransform
});
app.register(swagger_ui_1.default, {
    routePrefix: "/docs"
});
app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
// Customizar serialização de datas para garantir formato ISO completo
app.addHook("preSerialization", async (request, reply, payload) => {
    if (payload && typeof payload === "object") {
        const serializeDates = (obj) => {
            if (obj === null || obj === undefined)
                return obj;
            if (obj instanceof Date) {
                return obj.toISOString();
            }
            if (Array.isArray(obj)) {
                return obj.map(serializeDates);
            }
            if (typeof obj === "object") {
                const serialized = {};
                for (const [key, value] of Object.entries(obj)) {
                    serialized[key] = serializeDates(value);
                }
                return serialized;
            }
            return obj;
        };
        return serializeDates(payload);
    }
    return payload;
});
app.register(usuarioRoutes_1.usuarioRoutes);
app.register(appointmentRoutes_1.appointmentRoutes);
app.register(attendanceRoutes_1.attendanceRoutes);
app.setErrorHandler(error_handler_1.errorHandler);
app
    .listen({
    host: "0.0.0.0",
    port: 4000
})
    .then(() => {
    console.log("🚀 HTTP Server Running!");
})
    .catch((err) => {
    console.error("Erro ao subir o servidor:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map