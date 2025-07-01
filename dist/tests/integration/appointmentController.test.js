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
const appointmentController_1 = require("@/controllers/appointmentController");
// Mock dos serviços
vitest_1.vi.mock("@/service/appointmentService.service", () => ({
    createAppointment: vitest_1.vi.fn(),
    generateAvailableSlots: vitest_1.vi.fn(),
    getPatientAppointments: vitest_1.vi.fn(),
    getDoctorAppointments: vitest_1.vi.fn(),
    updateAppointmentStatus: vitest_1.vi.fn(),
    createDoctorAvailability: vitest_1.vi.fn(),
    getDoctorAvailability: vitest_1.vi.fn()
}));
// Mock do moment
vitest_1.vi.mock("moment-timezone", () => ({
    default: vitest_1.vi.fn(() => ({
        tz: vitest_1.vi.fn().mockReturnThis(),
        clone: vitest_1.vi.fn().mockReturnThis(),
        startOf: vitest_1.vi.fn().mockReturnThis(),
        endOf: vitest_1.vi.fn().mockReturnThis(),
        toDate: vitest_1.vi.fn(() => new Date("2024-01-01T00:00:00.000Z"))
    }))
}));
(0, vitest_1.describe)("appointmentController Integration", () => {
    let mockRequest;
    let mockReply;
    (0, vitest_1.beforeEach)(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            usuario: {
                id: "user-id",
                register: "patient"
            }
        };
        mockReply = {
            status: vitest_1.vi.fn().mockReturnThis(),
            code: vitest_1.vi.fn().mockReturnThis(),
            send: vitest_1.vi.fn().mockReturnThis()
        };
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("postAppointment", () => {
        (0, vitest_1.it)("deve criar agendamento para paciente", async () => {
            const { createAppointment } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.body = {
                doctorId: "doctor-id",
                startTime: "2024-01-01T10:00:00.000Z",
                notes: "Test appointment"
            };
            const mockAppointment = {
                id: "appointment-id",
                patientId: "user-id",
                doctorId: "doctor-id",
                startTime: new Date("2024-01-01T10:00:00.000Z"),
                endTime: new Date("2024-01-01T11:00:00.000Z"),
                status: "scheduled",
                notes: "Test appointment"
            };
            vitest_1.vi.mocked(createAppointment).mockResolvedValue(mockAppointment);
            await (0, appointmentController_1.postAppointment)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockAppointment
            });
        });
        (0, vitest_1.it)("deve impedir médico de agendar para si mesmo", async () => {
            mockRequest.usuario = {
                id: "doctor-id",
                register: "doctor"
            };
            await (0, appointmentController_1.postAppointment)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "error",
                message: "Médicos não podem agendar consultas para si mesmos"
            });
        });
    });
    (0, vitest_1.describe)("getAvailableSlots", () => {
        (0, vitest_1.it)("deve retornar slots disponíveis", async () => {
            const { generateAvailableSlots } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.query = {
                doctorId: "doctor-id",
                date: "2024-01-01"
            };
            const mockSlots = [
                {
                    startTime: "2024-01-01T10:00:00.000Z",
                    endTime: "2024-01-01T10:50:00.000Z",
                    available: true
                },
                {
                    startTime: "2024-01-01T11:00:00.000Z",
                    endTime: "2024-01-01T11:50:00.000Z",
                    available: true
                }
            ];
            vitest_1.vi.mocked(generateAvailableSlots).mockResolvedValue(mockSlots);
            await (0, appointmentController_1.getAvailableSlots)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockSlots
            });
        });
    });
    (0, vitest_1.describe)("getMyAppointments", () => {
        (0, vitest_1.it)("deve retornar agendamentos do paciente", async () => {
            const { getPatientAppointments } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.query = {
                status: "scheduled"
            };
            const mockAppointments = [
                {
                    id: "appointment-id",
                    patientId: "user-id",
                    doctorId: "doctor-id",
                    startTime: new Date("2024-01-01T10:00:00.000Z"),
                    endTime: new Date("2024-01-01T11:00:00.000Z"),
                    status: "scheduled"
                }
            ];
            vitest_1.vi.mocked(getPatientAppointments).mockResolvedValue(mockAppointments);
            await (0, appointmentController_1.getMyAppointments)(mockRequest, mockReply);
            (0, vitest_1.expect)(getPatientAppointments).toHaveBeenCalledWith("user-id", "scheduled");
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockAppointments
            });
        });
        (0, vitest_1.it)("deve retornar agendamentos do médico com filtro de data", async () => {
            const { getDoctorAppointments } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.usuario = {
                id: "doctor-id",
                register: "doctor"
            };
            mockRequest.query = {
                startDate: "2024-01-01",
                endDate: "2024-01-02"
            };
            const mockAppointments = [
                {
                    id: "appointment-id",
                    patientId: "patient-id",
                    doctorId: "doctor-id",
                    startTime: new Date("2024-01-01T10:00:00.000Z"),
                    endTime: new Date("2024-01-01T11:00:00.000Z"),
                    status: "scheduled"
                }
            ];
            vitest_1.vi.mocked(getDoctorAppointments).mockResolvedValue(mockAppointments);
            await (0, appointmentController_1.getMyAppointments)(mockRequest, mockReply);
            (0, vitest_1.expect)(getDoctorAppointments).toHaveBeenCalledWith("doctor-id", new Date("2024-01-01"), new Date("2024-01-02"));
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
        });
    });
    (0, vitest_1.describe)("putAppointmentStatus", () => {
        (0, vitest_1.it)("deve atualizar status do agendamento", async () => {
            const { updateAppointmentStatus } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.params = { id: "appointment-id" };
            mockRequest.body = { status: "confirmed" };
            const updatedAppointment = {
                id: "appointment-id",
                patientId: "user-id",
                doctorId: "doctor-id",
                startTime: new Date("2024-01-01T10:00:00.000Z"),
                endTime: new Date("2024-01-01T11:00:00.000Z"),
                status: "confirmed"
            };
            vitest_1.vi.mocked(updateAppointmentStatus).mockResolvedValue(updatedAppointment);
            await (0, appointmentController_1.putAppointmentStatus)(mockRequest, mockReply);
            (0, vitest_1.expect)(updateAppointmentStatus).toHaveBeenCalledWith("appointment-id", "confirmed", "user-id", "patient");
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: updatedAppointment
            });
        });
    });
    (0, vitest_1.describe)("postAvailability", () => {
        (0, vitest_1.it)("deve criar disponibilidade para médico", async () => {
            const { createDoctorAvailability } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.usuario = {
                id: "doctor-id",
                register: "doctor"
            };
            mockRequest.body = {
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00"
            };
            const mockAvailability = {
                id: "availability-id",
                doctorId: "doctor-id",
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            vitest_1.vi.mocked(createDoctorAvailability).mockResolvedValue(mockAvailability);
            await (0, appointmentController_1.postAvailability)(mockRequest, mockReply);
            (0, vitest_1.expect)(createDoctorAvailability).toHaveBeenCalledWith("doctor-id", {
                dayOfWeek: 1,
                startTime: "08:00",
                endTime: "17:00"
            });
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockAvailability
            });
        });
        (0, vitest_1.it)("deve impedir paciente de criar disponibilidade", async () => {
            mockRequest.usuario = {
                id: "patient-id",
                register: "patient"
            };
            await (0, appointmentController_1.postAvailability)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "error",
                message: "Apenas médicos podem configurar disponibilidade"
            });
        });
    });
    (0, vitest_1.describe)("getAvailability", () => {
        (0, vitest_1.it)("deve retornar disponibilidade do médico", async () => {
            const { getDoctorAvailability } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.params = { doctorId: "doctor-id" };
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
            vitest_1.vi.mocked(getDoctorAvailability).mockResolvedValue(mockAvailabilities);
            await (0, appointmentController_1.getAvailability)(mockRequest, mockReply);
            (0, vitest_1.expect)(getDoctorAvailability).toHaveBeenCalledWith("doctor-id");
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockAvailabilities
            });
        });
    });
    (0, vitest_1.describe)("getTodayAppointments", () => {
        (0, vitest_1.it)("deve retornar agendamentos do dia para médico", async () => {
            const { getDoctorAppointments } = await Promise.resolve().then(() => __importStar(require("@/service/appointmentService.service")));
            mockRequest.usuario = {
                id: "doctor-id",
                register: "doctor"
            };
            const mockTodayAppointments = [
                {
                    id: "appointment-id",
                    patientId: "patient-id",
                    doctorId: "doctor-id",
                    startTime: new Date("2024-01-01T10:00:00.000Z"),
                    endTime: new Date("2024-01-01T11:00:00.000Z"),
                    status: "scheduled"
                }
            ];
            vitest_1.vi.mocked(getDoctorAppointments).mockResolvedValue(mockTodayAppointments);
            await (0, appointmentController_1.getTodayAppointments)(mockRequest, mockReply);
            (0, vitest_1.expect)(getDoctorAppointments).toHaveBeenCalledWith("doctor-id", vitest_1.expect.any(Date), vitest_1.expect.any(Date));
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "success",
                data: mockTodayAppointments
            });
        });
        (0, vitest_1.it)("deve impedir paciente de acessar agendamentos do dia", async () => {
            mockRequest.usuario = {
                id: "patient-id",
                register: "patient"
            };
            await (0, appointmentController_1.getTodayAppointments)(mockRequest, mockReply);
            (0, vitest_1.expect)(mockReply.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockReply.send).toHaveBeenCalledWith({
                status: "error",
                message: "Apenas médicos podem acessar esta rota"
            });
        });
    });
});
//# sourceMappingURL=appointmentController.test.js.map