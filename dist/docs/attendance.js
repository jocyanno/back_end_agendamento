"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceDocs = exports.createAttendanceSchema = exports.attendanceSchema = void 0;
const v4_1 = require("zod/v4");
const auth_1 = require("@/middlewares/auth");
const scheme_1 = require("@/utils/scheme");
const errorResponseSchema = v4_1.z.object({
    status: v4_1.z.literal("error"),
    message: v4_1.z.string()
});
exports.attendanceSchema = v4_1.z.object({
    id: v4_1.z.string(),
    patientId: v4_1.z.string(),
    doctorId: v4_1.z.string(),
    description: v4_1.z.string(),
    date: v4_1.z.string(),
    createdAt: v4_1.z.string(),
    updatedAt: v4_1.z.string(),
    patient: v4_1.z
        .object({
        id: v4_1.z.string(),
        name: v4_1.z.string().nullish(),
        email: v4_1.z.string(),
        phone: v4_1.z.string().nullish()
    })
        .optional(),
    doctor: v4_1.z
        .object({
        id: v4_1.z.string(),
        name: v4_1.z.string().nullish(),
        email: v4_1.z.string(),
        phone: v4_1.z.string().nullish()
    })
        .optional()
});
exports.createAttendanceSchema = v4_1.z.object({
    patientId: v4_1.z.string(),
    description: v4_1.z.string().min(1, "Descrição obrigatória"),
    date: v4_1.z.string().optional() // pode ser preenchido automaticamente
});
class attendanceDocs {
}
exports.attendanceDocs = attendanceDocs;
attendanceDocs.postAttendance = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Attendance"],
        summary: "Registrar atendimento",
        description: "Profissional registra um atendimento realizado para um paciente.",
        headers: scheme_1.headersSchema,
        body: exports.createAttendanceSchema,
        response: {
            201: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: exports.attendanceSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
attendanceDocs.getMyAttendances = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Attendance"],
        summary: "Histórico de atendimentos do usuário",
        description: "Retorna todos os atendimentos realizados para o usuário logado.",
        headers: scheme_1.headersSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(exports.attendanceSchema)
            }),
            401: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
attendanceDocs.getPatientAttendances = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Attendance"],
        summary: "Histórico de atendimentos de um paciente",
        description: "Profissional visualiza todos os atendimentos de um paciente específico.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            id: v4_1.z.string().describe("ID do paciente")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(exports.attendanceSchema)
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
//# sourceMappingURL=attendance.js.map