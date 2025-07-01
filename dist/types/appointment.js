"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseAvailabilitySchema = exports.availabilitySchema = exports.getAvailableSlotsSchema = exports.updateAppointmentSchema = exports.createAppointmentSchema = exports.responseAppointmentWithUsersSchema = exports.responseAppointmentSchema = exports.responseAppointmentSchemaProps = exports.appointmentStatusEnum = void 0;
const v4_1 = require("zod/v4");
// Enums
exports.appointmentStatusEnum = v4_1.z.enum([
    "scheduled",
    "confirmed",
    "cancelled",
    "completed",
    "no_show"
]);
// Schema de resposta do agendamento
exports.responseAppointmentSchemaProps = {
    id: v4_1.z.string(),
    patientId: v4_1.z.string(),
    doctorId: v4_1.z.string(),
    startTime: v4_1.z.string(),
    endTime: v4_1.z.string(),
    status: exports.appointmentStatusEnum,
    notes: v4_1.z.string().nullish(),
    googleEventId: v4_1.z.string().nullish(),
    createdAt: v4_1.z.string(),
    updatedAt: v4_1.z.string()
};
exports.responseAppointmentSchema = v4_1.z.object(exports.responseAppointmentSchemaProps);
// Schema com dados do paciente e médico
exports.responseAppointmentWithUsersSchema = exports.responseAppointmentSchema.extend({
    patient: v4_1.z.object({
        id: v4_1.z.string(),
        name: v4_1.z.string().nullish(),
        email: v4_1.z.string(),
        phone: v4_1.z.string().nullish()
    }),
    doctor: v4_1.z.object({
        id: v4_1.z.string(),
        name: v4_1.z.string().nullish(),
        email: v4_1.z.string(),
        phone: v4_1.z.string().nullish()
    })
});
// Schema para criar agendamento
exports.createAppointmentSchema = v4_1.z.object({
    doctorId: v4_1.z.string().min(1, "ID do médico é obrigatório"),
    startTime: v4_1.z.string(),
    notes: v4_1.z.string().optional()
});
// Schema para atualizar agendamento
exports.updateAppointmentSchema = v4_1.z.object({
    startTime: v4_1.z.string().optional(),
    status: exports.appointmentStatusEnum.optional(),
    notes: v4_1.z.string().optional()
});
// Schema para buscar horários disponíveis
exports.getAvailableSlotsSchema = v4_1.z.object({
    doctorId: v4_1.z.string().min(1, "ID do médico é obrigatório"),
    date: v4_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});
// Schema de disponibilidade do médico
exports.availabilitySchema = v4_1.z.object({
    dayOfWeek: v4_1.z.number().min(0).max(6),
    startTime: v4_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm"),
    endTime: v4_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm"),
    isActive: v4_1.z.boolean().optional()
});
exports.responseAvailabilitySchema = exports.availabilitySchema.extend({
    id: v4_1.z.string(),
    doctorId: v4_1.z.string(),
    createdAt: v4_1.z.string(),
    updatedAt: v4_1.z.string()
});
//# sourceMappingURL=appointment.js.map