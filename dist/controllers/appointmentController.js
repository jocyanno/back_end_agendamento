"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAppointment = postAppointment;
exports.getAvailableSlots = getAvailableSlots;
exports.getMyAppointments = getMyAppointments;
exports.putAppointmentStatus = putAppointmentStatus;
exports.postAvailability = postAvailability;
exports.getAvailability = getAvailability;
exports.getTodayAppointments = getTodayAppointments;
exports.postAppointmentForPatient = postAppointmentForPatient;
exports.deleteAvailability = deleteAvailability;
exports.cancelAppointmentByAttendantController = cancelAppointmentByAttendantController;
const appointmentService_service_1 = require("../service/appointmentService.service");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const prisma_1 = require("../lib/prisma");
// Criar novo agendamento (paciente)
async function postAppointment(request, reply) {
    const { id: patientId, register } = request.usuario;
    if (register === "doctor") {
        return reply.status(400).send({
            status: "error",
            message: "Médicos não podem agendar consultas para si mesmos"
        });
    }
    const { doctorId, startTime, notes } = request.body;
    // Calcular endTime (50 minutos de sessão)
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + 50 * 60 * 1000); // +50 minutos
    const appointment = await (0, appointmentService_service_1.createAppointment)({
        patientId,
        doctorId,
        startTime,
        endTime: endDate.toISOString(),
        notes
    });
    return reply.status(201).send({
        status: "success",
        data: appointment
    });
}
// Buscar horários disponíveis
async function getAvailableSlots(request, reply) {
    const { doctorId, date } = request.query;
    const slots = await (0, appointmentService_service_1.generateAvailableSlots)(doctorId, date);
    return reply.status(200).send({
        status: "success",
        data: slots
    });
}
// Buscar agendamentos do usuário logado
async function getMyAppointments(request, reply) {
    const { id: userId, register } = request.usuario;
    const { status } = request.query;
    let appointments;
    if (register === "doctor") {
        const { startDate, endDate } = request.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        appointments = await (0, appointmentService_service_1.getDoctorAppointments)(userId, start, end);
    }
    else {
        appointments = await (0, appointmentService_service_1.getPatientAppointments)(userId, status);
    }
    return reply.status(200).send({
        status: "success",
        data: appointments
    });
}
// Atualizar status do agendamento
async function putAppointmentStatus(request, reply) {
    const { id: appointmentId } = request.params;
    const { status } = request.body;
    const { id: userId, register } = request.usuario;
    const updatedAppointment = await (0, appointmentService_service_1.updateAppointmentStatus)(appointmentId, status, userId, register);
    return reply.status(200).send({
        status: "success",
        data: updatedAppointment
    });
}
// Criar disponibilidade (médico)
async function postAvailability(request, reply) {
    try {
        const { id: doctorId, register } = request
            .usuario;
        if (register !== "doctor") {
            return reply.status(403).send({
                status: "error",
                message: "Apenas médicos podem configurar disponibilidade"
            });
        }
        const availability = request.body;
        const created = await (0, appointmentService_service_1.createDoctorAvailability)(doctorId, availability);
        return reply.status(201).send({
            status: "success",
            data: created
        });
    }
    catch (error) {
        if (error.message?.includes("Já existe disponibilidade")) {
            return reply.status(400).send({
                status: "error",
                message: error.message
            });
        }
        return reply.status(500).send({
            status: "error",
            message: "Erro interno do servidor"
        });
    }
}
// Buscar disponibilidade do médico
async function getAvailability(request, reply) {
    const { doctorId } = request.params;
    const availabilities = await (0, appointmentService_service_1.getDoctorAvailability)(doctorId);
    return reply.status(200).send({
        status: "success",
        data: availabilities
    });
}
// Buscar agendamentos do dia (médico)
async function getTodayAppointments(request, reply) {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
        return reply.status(403).send({
            status: "error",
            message: "Apenas médicos podem acessar esta rota"
        });
    }
    const today = (0, moment_timezone_1.default)().tz("America/Sao_Paulo");
    const startOfDay = today.clone().startOf("day").toDate();
    const endOfDay = today.clone().endOf("day").toDate();
    const appointments = await (0, appointmentService_service_1.getDoctorAppointments)(doctorId, startOfDay, endOfDay);
    return reply.status(200).send({
        status: "success",
        data: appointments
    });
}
// Criar agendamento para paciente (profissional)
async function postAppointmentForPatient(request, reply) {
    const { id: currentUserId, register } = request
        .usuario;
    // Verificar se é médico
    if (register !== "doctor") {
        return reply.status(403).send({
            status: "error",
            message: "Apenas médicos podem criar agendamentos para pacientes"
        });
    }
    const { patientId, doctorId, startTime, notes } = request.body;
    // Verificar se o paciente existe e não é médico
    const patient = await prisma_1.prisma.users.findUnique({
        where: { id: patientId },
        select: { id: true, register: true }
    });
    if (!patient) {
        return reply.status(404).send({
            status: "error",
            message: "Paciente não encontrado"
        });
    }
    if (patient.register === "doctor") {
        return reply.status(400).send({
            status: "error",
            message: "Não é possível agendar consulta para outro médico"
        });
    }
    // Verificar se o médico existe
    const doctor = await prisma_1.prisma.users.findUnique({
        where: { id: doctorId },
        select: { id: true, register: true }
    });
    if (!doctor || doctor.register !== "doctor") {
        return reply.status(404).send({
            status: "error",
            message: "Médico não encontrado"
        });
    }
    // Calcular endTime (50 minutos de sessão)
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + 50 * 60 * 1000); // +50 minutos
    const appointment = await (0, appointmentService_service_1.createAppointment)({
        patientId,
        doctorId,
        startTime,
        endTime: endDate.toISOString(),
        notes
    });
    return reply.status(201).send({
        status: "success",
        data: appointment
    });
}
// Deletar disponibilidade (médico)
async function deleteAvailability(request, reply) {
    try {
        const { id: doctorId, register } = request
            .usuario;
        if (register !== "doctor") {
            return reply.status(403).send({
                status: "error",
                message: "Apenas médicos podem deletar disponibilidade"
            });
        }
        const { availabilityId } = request.params;
        const result = await (0, appointmentService_service_1.deleteDoctorAvailability)(availabilityId, doctorId);
        return reply.status(200).send({
            status: "success",
            data: result
        });
    }
    catch (error) {
        if (error.message?.includes("não encontrada")) {
            return reply.status(404).send({
                status: "error",
                message: error.message
            });
        }
        if (error.message?.includes("agendamentos futuros")) {
            return reply.status(400).send({
                status: "error",
                message: error.message
            });
        }
        return reply.status(500).send({
            status: "error",
            message: "Erro interno do servidor"
        });
    }
}
// Cancelar agendamento (attendant)
async function cancelAppointmentByAttendantController(request, reply) {
    try {
        // Verificar se o usuário logado é attendant
        const { id: attendantId, register } = request
            .usuario;
        if (register !== "attendant") {
            return reply.status(403).send({
                status: "error",
                message: "Apenas atendentes podem cancelar agendamentos"
            });
        }
        const { appointmentId } = request.params;
        const cancelledAppointment = await (0, appointmentService_service_1.cancelAppointmentByAttendant)(appointmentId, attendantId);
        return reply.status(200).send({
            status: "success",
            data: cancelledAppointment
        });
    }
    catch (error) {
        if (error.message?.includes("não encontrado")) {
            return reply.status(404).send({
                status: "error",
                message: error.message
            });
        }
        if (error.message?.includes("Não é possível cancelar")) {
            return reply.status(400).send({
                status: "error",
                message: error.message
            });
        }
        return reply.status(500).send({
            status: "error",
            message: "Erro interno do servidor"
        });
    }
}
//# sourceMappingURL=appointmentController.js.map