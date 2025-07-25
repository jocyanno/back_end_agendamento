"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceDocs = exports.appointmentDocs = exports.createAppointmentForPatientSchema = exports.createAttendanceSchema = exports.attendanceSchema = void 0;
const v4_1 = require("zod/v4");
const auth_1 = require("../middlewares/auth");
const scheme_1 = require("../utils/scheme");
const appointment_1 = require("../types/appointment");
const errorResponseSchema = v4_1.z.object({
    status: v4_1.z.literal("error"),
    message: v4_1.z.string()
});
// Attendance Schemas
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
// Schema para criação de agendamento pelo profissional
exports.createAppointmentForPatientSchema = v4_1.z.object({
    patientId: v4_1.z.string().describe("ID do paciente"),
    doctorId: v4_1.z
        .string()
        .describe("ID do médico (pode ser o próprio médico logado)"),
    startTime: v4_1.z.string().describe("Data e hora de início do agendamento"),
    notes: v4_1.z.string().optional().describe("Observações sobre o agendamento")
});
class appointmentDocs {
}
exports.appointmentDocs = appointmentDocs;
appointmentDocs.postAppointment = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Criar novo agendamento",
        description: "Cria um novo agendamento. Pacientes podem agendar apenas 1 consulta por semana.",
        headers: scheme_1.headersSchema,
        body: appointment_1.createAppointmentSchema,
        response: {
            201: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: appointment_1.responseAppointmentWithUsersSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.getAvailableSlots = {
    schema: {
        tags: ["Appointment"],
        summary: "Buscar horários disponíveis",
        description: "Retorna os horários disponíveis de um médico em uma data específica",
        querystring: appointment_1.getAvailableSlotsSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(v4_1.z.object({
                    startTime: v4_1.z.string(),
                    endTime: v4_1.z.string(),
                    available: v4_1.z.boolean()
                }))
            }),
            400: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.getMyAppointments = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Buscar meus agendamentos",
        description: "Retorna os agendamentos do usuário logado (paciente ou médico)",
        headers: scheme_1.headersSchema,
        querystring: v4_1.z.object({
            status: appointment_1.appointmentStatusEnum.optional(),
            startDate: v4_1.z.string().optional(),
            endDate: v4_1.z.string().optional()
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(appointment_1.responseAppointmentWithUsersSchema)
            }),
            401: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.putAppointmentStatus = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Atualizar status do agendamento",
        description: "Atualiza o status de um agendamento. Pacientes só podem alterar seus próprios agendamentos, médicos só podem alterar seus agendamentos.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            id: v4_1.z.string().describe("ID do agendamento")
        }),
        body: v4_1.z.object({
            status: v4_1.z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"])
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: appointment_1.responseAppointmentWithUsersSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.cancelAppointmentByAttendant = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Cancelar agendamento (attendant)",
        description: "Permite que atendentes cancelem agendamentos. Não é possível cancelar agendamentos que já passaram ou foram finalizados.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            appointmentId: v4_1.z.string().describe("ID do agendamento a ser cancelado")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: appointment_1.responseAppointmentWithUsersSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.postAvailability = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Availability"],
        summary: "Configurar disponibilidade",
        description: "Configura a disponibilidade do médico para um dia da semana",
        headers: scheme_1.headersSchema,
        body: appointment_1.availabilitySchema,
        response: {
            201: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: appointment_1.responseAvailabilitySchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.getAvailability = {
    schema: {
        tags: ["Availability"],
        summary: "Buscar disponibilidade do médico",
        description: "Retorna a disponibilidade configurada de um médico",
        params: v4_1.z.object({
            doctorId: v4_1.z.string().describe("ID do médico")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(appointment_1.responseAvailabilitySchema)
            }),
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.deleteAvailability = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Availability"],
        summary: "Deletar disponibilidade do médico",
        description: "Deleta uma disponibilidade específica do médico logado. Não é possível deletar se houver agendamentos futuros.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            availabilityId: v4_1.z
                .string()
                .describe("ID da disponibilidade a ser deletada")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.object({
                    message: v4_1.z.string()
                })
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.getTodayAppointments = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Agendamentos do dia",
        description: "Retorna os agendamentos do dia para o médico logado",
        headers: scheme_1.headersSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(appointment_1.responseAppointmentWithUsersSchema)
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
appointmentDocs.postAppointmentForPatient = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Appointment"],
        summary: "Criar agendamento para paciente (profissional)",
        description: "Permite que profissionais criem agendamentos para pacientes. Apenas médicos podem usar esta rota.",
        headers: scheme_1.headersSchema,
        body: exports.createAppointmentForPatientSchema,
        response: {
            201: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: appointment_1.responseAppointmentWithUsersSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
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
//# sourceMappingURL=appointment.js.map