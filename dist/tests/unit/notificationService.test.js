"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const notificationService_service_1 = require("../../service/notificationService.service");
// Mock do prisma
vitest_1.vi.mock("@/lib/prisma", () => ({
    prisma: {
        notification: {
            create: vitest_1.vi.fn()
        },
        appointment: {
            update: vitest_1.vi.fn()
        }
    }
}));
// Mock das funções do notification service
vitest_1.vi.mock("@/service/notificationService.service", async () => {
    const actual = await vitest_1.vi.importActual("@/service/notificationService.service");
    return {
        ...actual,
        sendEmail: vitest_1.vi.fn(),
        createNotification: vitest_1.vi.fn(),
        sendAppointmentConfirmation: vitest_1.vi.fn(),
        sendAppointmentCancellation: vitest_1.vi.fn()
    };
});
// Mock do nodemailer
vitest_1.vi.mock("nodemailer", () => ({
    default: {
        createTransport: vitest_1.vi.fn(() => ({
            sendMail: vitest_1.vi.fn()
        }))
    }
}));
const mockAppointment = {
    id: "appointment-1",
    patientId: "patient-1",
    doctorId: "doctor-1",
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-15T10:50:00Z"),
    status: "scheduled",
    notes: "Consulta de rotina",
    patient: {
        id: "patient-1",
        name: "João Silva",
        email: "joao@test.com"
    },
    doctor: {
        id: "doctor-1",
        name: "Dr. Maria",
        email: "drmaria@test.com"
    },
    googleEventId: "google-event-123"
};
(0, vitest_1.describe)("Notification Service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("sendEmail", () => {
        (0, vitest_1.it)("deve enviar email com sucesso", async () => {
            vitest_1.vi.mocked(notificationService_service_1.sendEmail).mockResolvedValue(true);
            const result = await (0, notificationService_service_1.sendEmail)("test@test.com", "Teste", "<p>Conteúdo</p>");
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(notificationService_service_1.sendEmail).toHaveBeenCalledWith("test@test.com", "Teste", "<p>Conteúdo</p>");
        });
        (0, vitest_1.it)("deve retornar false em caso de erro", async () => {
            vitest_1.vi.mocked(notificationService_service_1.sendEmail).mockResolvedValue(false);
            const result = await (0, notificationService_service_1.sendEmail)("invalid-email", "Teste", "<p>Conteúdo</p>");
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)("getAppointmentConfirmationTemplate", () => {
        (0, vitest_1.it)("deve gerar template de confirmação correto", () => {
            const data = {
                patientName: "João Silva",
                doctorName: "Dr. Maria",
                date: "15/01/2024",
                time: "10:00"
            };
            const template = (0, notificationService_service_1.getAppointmentConfirmationTemplate)(data);
            (0, vitest_1.expect)(template).toContain("Confirmação de Agendamento");
            (0, vitest_1.expect)(template).toContain("João Silva");
            (0, vitest_1.expect)(template).toContain("Dr. Maria");
            (0, vitest_1.expect)(template).toContain("15/01/2024");
            (0, vitest_1.expect)(template).toContain("10:00");
            (0, vitest_1.expect)(template).toContain("O evento foi adicionado ao seu calendário Google");
        });
        (0, vitest_1.it)("deve gerar template com informações completas", () => {
            const data = {
                patientName: "João Silva",
                doctorName: "Dr. Maria",
                date: "15/01/2024",
                time: "10:00",
                location: "Clínica ABC"
            };
            const template = (0, notificationService_service_1.getAppointmentConfirmationTemplate)(data);
            (0, vitest_1.expect)(template).toContain("Confirmação de Agendamento");
            (0, vitest_1.expect)(template).toContain("Clínica ABC");
            (0, vitest_1.expect)(template).toContain("O evento foi adicionado ao seu calendário Google");
        });
    });
    (0, vitest_1.describe)("getAppointmentCancellationTemplate", () => {
        (0, vitest_1.it)("deve gerar template de cancelamento correto", () => {
            const data = {
                patientName: "João Silva",
                doctorName: "Dr. Maria",
                date: "15/01/2024",
                time: "10:00",
                reason: "Conflito de agenda"
            };
            const template = (0, notificationService_service_1.getAppointmentCancellationTemplate)(data);
            (0, vitest_1.expect)(template).toContain("Agendamento Cancelado");
            (0, vitest_1.expect)(template).toContain("João Silva");
            (0, vitest_1.expect)(template).toContain("Dr. Maria");
            (0, vitest_1.expect)(template).toContain("15/01/2024");
            (0, vitest_1.expect)(template).toContain("10:00");
            (0, vitest_1.expect)(template).toContain("Conflito de agenda");
        });
        (0, vitest_1.it)("deve gerar template sem motivo", () => {
            const data = {
                patientName: "João Silva",
                doctorName: "Dr. Maria",
                date: "15/01/2024",
                time: "10:00"
            };
            const template = (0, notificationService_service_1.getAppointmentCancellationTemplate)(data);
            (0, vitest_1.expect)(template).toContain("Agendamento Cancelado");
            (0, vitest_1.expect)(template).not.toContain("Motivo:");
        });
    });
    (0, vitest_1.describe)("createNotification", () => {
        (0, vitest_1.it)("deve criar notificação", async () => {
            const notificationData = {
                userId: "user-1",
                appointmentId: "appointment-1",
                type: "confirmation",
                title: "Agendamento Confirmado",
                message: "Sua consulta foi confirmada"
            };
            vitest_1.vi.mocked(notificationService_service_1.createNotification).mockResolvedValue({
                id: "notification-1",
                ...notificationData,
                sentAt: null,
                readAt: null,
                createdAt: new Date()
            });
            const result = await (0, notificationService_service_1.createNotification)(notificationData);
            (0, vitest_1.expect)(notificationService_service_1.createNotification).toHaveBeenCalledWith(notificationData);
            (0, vitest_1.expect)(result).toHaveProperty("id");
        });
    });
    (0, vitest_1.describe)("sendAppointmentConfirmation", () => {
        (0, vitest_1.it)("deve enviar confirmação de agendamento", async () => {
            vitest_1.vi.mocked(notificationService_service_1.sendAppointmentConfirmation).mockResolvedValue(undefined);
            await (0, notificationService_service_1.sendAppointmentConfirmation)(mockAppointment);
            (0, vitest_1.expect)(notificationService_service_1.sendAppointmentConfirmation).toHaveBeenCalledWith(mockAppointment);
        });
    });
    (0, vitest_1.describe)("sendAppointmentCancellation", () => {
        (0, vitest_1.it)("deve enviar notificação de cancelamento", async () => {
            vitest_1.vi.mocked(notificationService_service_1.sendAppointmentCancellation).mockResolvedValue(undefined);
            await (0, notificationService_service_1.sendAppointmentCancellation)(mockAppointment, "Conflito de agenda");
            (0, vitest_1.expect)(notificationService_service_1.sendAppointmentCancellation).toHaveBeenCalledWith(mockAppointment, "Conflito de agenda");
        });
        (0, vitest_1.it)("deve enviar notificação de cancelamento sem motivo", async () => {
            vitest_1.vi.mocked(notificationService_service_1.sendAppointmentCancellation).mockResolvedValue(undefined);
            await (0, notificationService_service_1.sendAppointmentCancellation)(mockAppointment);
            (0, vitest_1.expect)(notificationService_service_1.sendAppointmentCancellation).toHaveBeenCalledWith(mockAppointment);
        });
    });
});
//# sourceMappingURL=notificationService.test.js.map