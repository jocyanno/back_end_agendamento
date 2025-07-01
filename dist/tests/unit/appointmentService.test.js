"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const appointmentService_service_1 = require("@/service/appointmentService.service");
const bad_request_1 = require("@/_errors/bad-request");
const not_found_1 = require("@/_errors/not-found");
const unauthorized_1 = require("@/_errors/unauthorized");
// Mock do Prisma
vitest_1.vi.mock("@/lib/prisma", () => ({
    prisma: {
        appointment: {
            findFirst: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn()
        },
        availability: {
            findFirst: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            create: vitest_1.vi.fn()
        },
        users: {
            findUnique: vitest_1.vi.fn()
        }
    }
}));
// Mock do moment
vitest_1.vi.mock("moment-timezone", () => ({
    default: vitest_1.vi.fn(() => ({
        tz: vitest_1.vi.fn().mockReturnThis(),
        startOf: vitest_1.vi.fn().mockReturnThis(),
        endOf: vitest_1.vi.fn().mockReturnThis(),
        toDate: vitest_1.vi.fn(() => new Date("2024-01-01T08:00:00.000Z")),
        format: vitest_1.vi.fn(() => "2024-01-01T08:00:00.000Z"),
        isBefore: vitest_1.vi.fn(() => false),
        isAfter: vitest_1.vi.fn(() => false),
        isSameOrBefore: vitest_1.vi.fn(() => true),
        clone: vitest_1.vi.fn().mockReturnThis(),
        hour: vitest_1.vi.fn().mockReturnThis(),
        minute: vitest_1.vi.fn().mockReturnThis(),
        second: vitest_1.vi.fn().mockReturnThis(),
        millisecond: vitest_1.vi.fn().mockReturnThis(),
        add: vitest_1.vi.fn().mockReturnThis(),
        day: vitest_1.vi.fn(() => 1),
        diff: vitest_1.vi.fn(() => 25),
        toISOString: vitest_1.vi.fn(() => "2024-01-01T08:00:00.000Z")
    }))
}));
// Mock dos serviços externos
vitest_1.vi.mock("@/service/notificationService.service", () => ({
    sendAppointmentConfirmation: vitest_1.vi.fn(),
    sendAppointmentCancellation: vitest_1.vi.fn()
}));
const prisma_1 = require("@/lib/prisma");
(0, vitest_1.describe)("appointmentService", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("checkWeeklyAppointmentLimit", () => {
        (0, vitest_1.it)("deve permitir agendamento se não houver conflito semanal", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findFirst).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, appointmentService_service_1.checkWeeklyAppointmentLimit)("patient-id", new Date())).resolves.not.toThrow();
        });
        (0, vitest_1.it)("deve lançar erro se já houver agendamento na semana", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findFirst).mockResolvedValue({
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date(),
                endTime: new Date(),
                status: "scheduled"
            });
            await (0, vitest_1.expect)((0, appointmentService_service_1.checkWeeklyAppointmentLimit)("patient-id", new Date())).rejects.toThrow("Paciente já possui consulta agendada nesta semana");
        });
    });
    (0, vitest_1.describe)("checkSlotAvailability", () => {
        (0, vitest_1.it)("deve permitir agendamento em horário livre", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findFirst).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, appointmentService_service_1.checkSlotAvailability)("doctor-id", new Date(), new Date())).resolves.not.toThrow();
        });
        (0, vitest_1.it)("deve lançar erro se horário estiver ocupado", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findFirst).mockResolvedValue({
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date(),
                endTime: new Date(),
                status: "scheduled"
            });
            await (0, vitest_1.expect)((0, appointmentService_service_1.checkSlotAvailability)("doctor-id", new Date(), new Date())).rejects.toThrow(bad_request_1.BadRequest);
        });
    });
    (0, vitest_1.describe)("generateAvailableSlots", () => {
        (0, vitest_1.it)("deve retornar slots vazios se médico não tiver disponibilidade", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.availability.findFirst).mockResolvedValue(null);
            const slots = await (0, appointmentService_service_1.generateAvailableSlots)("doctor-id", "2024-01-01");
            (0, vitest_1.expect)(slots).toEqual([]);
        });
        (0, vitest_1.it)("deve gerar slots disponíveis corretamente", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.availability.findFirst).mockResolvedValue({
                id: "availability-id",
                doctorId: "doctor-id",
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findMany).mockResolvedValue([]);
            const slots = await (0, appointmentService_service_1.generateAvailableSlots)("doctor-id", "2024-01-01");
            (0, vitest_1.expect)(Array.isArray(slots)).toBe(true);
        });
    });
    (0, vitest_1.describe)("createAppointment", () => {
        (0, vitest_1.it)("deve criar agendamento com dados válidos", async () => {
            const mockPatient = {
                id: "patient-id",
                email: "patient@test.com",
                register: "patient"
            };
            const mockDoctor = {
                id: "doctor-id",
                email: "doctor@test.com",
                register: "doctor"
            };
            const mockAppointment = {
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date(),
                endTime: new Date(),
                status: "scheduled",
                notes: "Test notes",
                patient: mockPatient,
                doctor: mockDoctor
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique)
                .mockResolvedValueOnce(mockPatient)
                .mockResolvedValueOnce(mockDoctor);
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findFirst).mockResolvedValue(null);
            vitest_1.vi.mocked(prisma_1.prisma.appointment.create).mockResolvedValue(mockAppointment);
            vitest_1.vi.mocked(prisma_1.prisma.appointment.update).mockResolvedValue(mockAppointment);
            const result = await (0, appointmentService_service_1.createAppointment)({
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                notes: "Test notes"
            });
            (0, vitest_1.expect)(result).toEqual(mockAppointment);
        });
        (0, vitest_1.it)("deve lançar erro se paciente não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, appointmentService_service_1.createAppointment)({
                patientId: "invalid-patient-id",
                doctorId: "doctor-id",
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString()
            })).rejects.toThrow("Paciente não encontrado");
        });
        (0, vitest_1.it)("deve lançar erro se médico não existir", async () => {
            const mockPatient = {
                id: "patient-id",
                email: "patient@test.com",
                register: "patient"
            };
            vitest_1.vi.mocked(prisma_1.prisma.users.findUnique)
                .mockResolvedValueOnce(mockPatient)
                .mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, appointmentService_service_1.createAppointment)({
                patientId: "patient-id",
                doctorId: "invalid-doctor-id",
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString()
            })).rejects.toThrow("Médico não encontrado");
        });
    });
    (0, vitest_1.describe)("getPatientAppointments", () => {
        (0, vitest_1.it)("deve retornar agendamentos do paciente", async () => {
            const mockAppointments = [
                {
                    id: "appointment-id",
                    patientId: "patient-id",
                    doctorId: "doctor-id",
                    startTime: new Date(),
                    endTime: new Date(),
                    status: "scheduled"
                }
            ];
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findMany).mockResolvedValue(mockAppointments);
            const result = await (0, appointmentService_service_1.getPatientAppointments)("patient-id");
            (0, vitest_1.expect)(result).toEqual(mockAppointments);
            (0, vitest_1.expect)(prisma_1.prisma.appointment.findMany).toHaveBeenCalledWith({
                where: { patientId: "patient-id" },
                select: vitest_1.expect.any(Object),
                orderBy: { startTime: "desc" }
            });
        });
        (0, vitest_1.it)("deve filtrar por status quando fornecido", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findMany).mockResolvedValue([]);
            await (0, appointmentService_service_1.getPatientAppointments)("patient-id", "scheduled");
            (0, vitest_1.expect)(prisma_1.prisma.appointment.findMany).toHaveBeenCalledWith({
                where: { patientId: "patient-id", status: "scheduled" },
                select: vitest_1.expect.any(Object),
                orderBy: { startTime: "desc" }
            });
        });
    });
    (0, vitest_1.describe)("getDoctorAppointments", () => {
        (0, vitest_1.it)("deve retornar agendamentos do médico", async () => {
            const mockAppointments = [
                {
                    id: "appointment-id",
                    patientId: "patient-id",
                    doctorId: "doctor-id",
                    startTime: new Date(),
                    endTime: new Date(),
                    status: "scheduled"
                }
            ];
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findMany).mockResolvedValue(mockAppointments);
            const result = await (0, appointmentService_service_1.getDoctorAppointments)("doctor-id");
            (0, vitest_1.expect)(result).toEqual(mockAppointments);
            (0, vitest_1.expect)(prisma_1.prisma.appointment.findMany).toHaveBeenCalledWith({
                where: { doctorId: "doctor-id" },
                select: vitest_1.expect.any(Object),
                orderBy: { startTime: "asc" }
            });
        });
        (0, vitest_1.it)("deve filtrar por data quando fornecido", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findMany).mockResolvedValue([]);
            const startDate = new Date("2024-01-01");
            const endDate = new Date("2024-01-02");
            await (0, appointmentService_service_1.getDoctorAppointments)("doctor-id", startDate, endDate);
            (0, vitest_1.expect)(prisma_1.prisma.appointment.findMany).toHaveBeenCalledWith({
                where: {
                    doctorId: "doctor-id",
                    startTime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: vitest_1.expect.any(Object),
                orderBy: { startTime: "asc" }
            });
        });
    });
    (0, vitest_1.describe)("updateAppointmentStatus", () => {
        (0, vitest_1.it)("deve atualizar status do agendamento", async () => {
            const mockAppointment = {
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date("2024-12-01T10:00:00.000Z"),
                endTime: new Date("2024-12-01T11:00:00.000Z"),
                status: "scheduled",
                patient: { id: "patient-id", name: "Patient" },
                doctor: { id: "doctor-id", name: "Doctor" }
            };
            const updatedAppointment = {
                ...mockAppointment,
                status: "confirmed"
            };
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
            vitest_1.vi.mocked(prisma_1.prisma.appointment.update).mockResolvedValue(updatedAppointment);
            const result = await (0, appointmentService_service_1.updateAppointmentStatus)("appointment-id", "confirmed", "patient-id", "patient");
            (0, vitest_1.expect)(result).toEqual(updatedAppointment);
        });
        (0, vitest_1.it)("deve lançar erro se agendamento não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, appointmentService_service_1.updateAppointmentStatus)("invalid-id", "confirmed", "user-id", "patient")).rejects.toThrow(not_found_1.NotFound);
        });
        (0, vitest_1.it)("deve lançar erro se usuário não tiver permissão", async () => {
            const mockAppointment = {
                id: "appointment-id",
                patientId: "other-patient-id",
                doctorId: "doctor-id",
                status: "scheduled"
            };
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
            await (0, vitest_1.expect)((0, appointmentService_service_1.updateAppointmentStatus)("appointment-id", "confirmed", "patient-id", "patient")).rejects.toThrow(unauthorized_1.Unauthorized);
        });
        (0, vitest_1.it)("deve lançar erro ao tentar alterar agendamento finalizado", async () => {
            const mockAppointment = {
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                status: "completed"
            };
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
            await (0, vitest_1.expect)((0, appointmentService_service_1.updateAppointmentStatus)("appointment-id", "cancelled", "patient-id", "patient")).rejects.toThrow(bad_request_1.BadRequest);
        });
    });
    (0, vitest_1.describe)("createDoctorAvailability", () => {
        (0, vitest_1.it)("deve criar disponibilidade para médico", async () => {
            const availabilityData = {
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00"
            };
            const mockCreated = {
                id: "availability-id",
                doctorId: "doctor-id",
                ...availabilityData,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(prisma_1.prisma.availability.findFirst).mockResolvedValue(null);
            vitest_1.vi.mocked(prisma_1.prisma.availability.create).mockResolvedValue(mockCreated);
            const result = await (0, appointmentService_service_1.createDoctorAvailability)("doctor-id", availabilityData);
            (0, vitest_1.expect)(result).toEqual(mockCreated);
        });
        (0, vitest_1.it)("deve lançar erro se já existir disponibilidade conflitante", async () => {
            const availabilityData = {
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00"
            };
            vitest_1.vi.mocked(prisma_1.prisma.availability.findFirst).mockResolvedValue({
                id: "existing-availability-id",
                doctorId: "doctor-id",
                dayOfWeek: 1,
                startTime: "07:00",
                endTime: "16:00",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await (0, vitest_1.expect)((0, appointmentService_service_1.createDoctorAvailability)("doctor-id", availabilityData)).rejects.toThrow(bad_request_1.BadRequest);
        });
    });
    (0, vitest_1.describe)("getDoctorAvailability", () => {
        (0, vitest_1.it)("deve retornar disponibilidades do médico", async () => {
            const mockAvailabilities = [
                {
                    id: "availability-id",
                    doctorId: "doctor-id",
                    dayOfWeek: 1,
                    startTime: "08:00",
                    endTime: "17:00",
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            vitest_1.vi.mocked(prisma_1.prisma.availability.findMany).mockResolvedValue(mockAvailabilities);
            const result = await (0, appointmentService_service_1.getDoctorAvailability)("doctor-id");
            (0, vitest_1.expect)(result).toEqual(mockAvailabilities);
            (0, vitest_1.expect)(prisma_1.prisma.availability.findMany).toHaveBeenCalledWith({
                where: {
                    doctorId: "doctor-id",
                    isActive: true
                },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
            });
        });
    });
    (0, vitest_1.describe)("getAppointmentById", () => {
        (0, vitest_1.it)("deve retornar agendamento por ID", async () => {
            const mockAppointment = {
                id: "appointment-id",
                patientId: "patient-id",
                doctorId: "doctor-id",
                startTime: new Date(),
                endTime: new Date(),
                status: "scheduled",
                patient: { id: "patient-id", name: "Patient" },
                doctor: { id: "doctor-id", name: "Doctor" }
            };
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
            const result = await (0, appointmentService_service_1.getAppointmentById)("appointment-id");
            (0, vitest_1.expect)(result).toEqual(mockAppointment);
        });
        (0, vitest_1.it)("deve retornar null se agendamento não existir", async () => {
            vitest_1.vi.mocked(prisma_1.prisma.appointment.findUnique).mockResolvedValue(null);
            const result = await (0, appointmentService_service_1.getAppointmentById)("invalid-id");
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
});
//# sourceMappingURL=appointmentService.test.js.map