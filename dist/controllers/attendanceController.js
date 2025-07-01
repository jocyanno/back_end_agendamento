"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAttendance = postAttendance;
exports.getMyAttendances = getMyAttendances;
exports.getPatientAttendances = getPatientAttendances;
const prisma_1 = require("@/lib/prisma");
// POST /attendances
async function postAttendance(request, reply) {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
        return reply.status(403).send({
            status: "error",
            message: "Apenas profissionais podem registrar atendimentos"
        });
    }
    const { patientId, description, date } = request.body;
    const attendance = await prisma_1.prisma.attendance.create({
        data: {
            patientId,
            doctorId,
            description,
            date: date ? new Date(date) : undefined
        },
        include: {
            patient: true,
            doctor: true
        }
    });
    return reply.status(201).send({
        status: "success",
        data: attendance
    });
}
// GET /attendances/my
async function getMyAttendances(request, reply) {
    const { id: userId, register } = request.usuario;
    let where = {};
    if (register === "doctor") {
        where = { doctorId: userId };
    }
    else {
        where = { patientId: userId };
    }
    const attendances = await prisma_1.prisma.attendance.findMany({
        where,
        include: {
            patient: true,
            doctor: true
        },
        orderBy: { date: "desc" }
    });
    return reply.status(200).send({
        status: "success",
        data: attendances
    });
}
// GET /attendances/patient/:id
async function getPatientAttendances(request, reply) {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
        return reply.status(403).send({
            status: "error",
            message: "Apenas profissionais podem acessar o histórico de pacientes"
        });
    }
    const { id: patientId } = request.params;
    const attendances = await prisma_1.prisma.attendance.findMany({
        where: { patientId },
        include: {
            patient: true,
            doctor: true
        },
        orderBy: { date: "desc" }
    });
    return reply.status(200).send({
        status: "success",
        data: attendances
    });
}
//# sourceMappingURL=attendanceController.js.map