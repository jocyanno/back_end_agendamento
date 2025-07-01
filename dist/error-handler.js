"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const v4_1 = require("zod/v4");
const bad_request_1 = require("./_errors/bad-request");
const not_found_1 = require("./_errors/not-found");
const unauthorized_1 = require("./_errors/unauthorized");
function errorHandler(error, request, reply) {
    // Erros de validação do Zod
    if (error instanceof v4_1.ZodError) {
        return reply.status(400).send({
            status: "error",
            message: "Validation error",
            issues: error.flatten().fieldErrors
        });
    }
    // Erros de validação do Fastify Schema
    if (error.code === "FST_ERR_VALIDATION") {
        if (error.validationContext === "headers" &&
            String(error.message).toLowerCase().includes("authorization")) {
            return reply.status(401).send({
                status: "error",
                message: "Token inválido ou não fornecido"
            });
        }
        return reply.status(400).send({
            status: "error",
            message: "Validation error",
            details: error.message
        });
    }
    // Erros de JWT
    if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
        return reply.status(401).send({
            status: "error",
            message: "Token inválido ou não fornecido"
        });
    }
    if (error.code === "FST_JWT_BAD_REQUEST") {
        return reply.status(401).send({
            status: "error",
            message: "Token inválido"
        });
    }
    // Erros customizados da aplicação
    if (error instanceof bad_request_1.BadRequest) {
        return reply.status(400).send({
            status: "error",
            message: error.message
        });
    }
    if (error instanceof not_found_1.NotFound) {
        return reply.status(404).send({
            status: "error",
            message: error.message
        });
    }
    if (error instanceof unauthorized_1.Unauthorized) {
        return reply.status(401).send({
            status: "error",
            message: error.message
        });
    }
    // Log do erro para debug
    console.error("Internal server error:", error);
    return reply.status(500).send({
        status: "error",
        message: "Internal server error"
    });
}
//# sourceMappingURL=error-handler.js.map