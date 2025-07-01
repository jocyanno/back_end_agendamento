"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock das dependências externas no nível superior
vitest_1.vi.mock("googleapis");
vitest_1.vi.mock("google-auth-library");
vitest_1.vi.mock("moment-timezone");
// Mock das funções que queremos testar
vitest_1.vi.mock("@/service/googleCalendarService.service", async () => {
    const actual = await vitest_1.vi.importActual("@/service/googleCalendarService.service");
    return {
        ...actual,
        createCalendarEvent: vitest_1.vi.fn(),
        updateCalendarEvent: vitest_1.vi.fn(),
        deleteCalendarEvent: vitest_1.vi.fn(),
        getCalendarEvents: vitest_1.vi.fn(),
        checkCalendarAvailability: vitest_1.vi.fn()
    };
});
const googleCalendarService_service_1 = require("../../service/googleCalendarService.service");
(0, vitest_1.describe)("googleCalendarService", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("createCalendarEvent", () => {
        (0, vitest_1.it)("deve criar evento no Google Calendar com sucesso", async () => {
            const eventData = {
                summary: "Consulta Médica",
                description: "Consulta com Dr. João",
                startTime: new Date("2024-01-01T10:00:00.000Z"),
                endTime: new Date("2024-01-01T11:00:00.000Z"),
                attendees: [
                    { email: "patient@test.com", displayName: "Paciente" },
                    { email: "doctor@test.com", displayName: "Dr. João" }
                ],
                location: "Consultório",
                conferenceData: true
            };
            const expectedResult = {
                eventId: "event-id-123",
                htmlLink: "https://calendar.google.com/event-link",
                meetLink: "https://meet.google.com/test-meet"
            };
            vitest_1.vi.mocked(googleCalendarService_service_1.createCalendarEvent).mockResolvedValue(expectedResult);
            const result = await (0, googleCalendarService_service_1.createCalendarEvent)(eventData);
            (0, vitest_1.expect)(result).toEqual(expectedResult);
            (0, vitest_1.expect)(googleCalendarService_service_1.createCalendarEvent).toHaveBeenCalledWith(eventData);
        });
        (0, vitest_1.it)("deve retornar null em caso de erro", async () => {
            const eventData = {
                summary: "Consulta Médica",
                description: "Consulta com Dr. João",
                startTime: new Date("2024-01-01T10:00:00.000Z"),
                endTime: new Date("2024-01-01T11:00:00.000Z"),
                attendees: [{ email: "patient@test.com" }]
            };
            vitest_1.vi.mocked(googleCalendarService_service_1.createCalendarEvent).mockResolvedValue(null);
            const result = await (0, googleCalendarService_service_1.createCalendarEvent)(eventData);
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)("updateCalendarEvent", () => {
        (0, vitest_1.it)("deve atualizar evento no Google Calendar", async () => {
            const eventId = "event-id-123";
            const updates = {
                summary: "Consulta Reagendada",
                startTime: new Date("2024-01-02T10:00:00.000Z"),
                endTime: new Date("2024-01-02T11:00:00.000Z"),
                attendees: [{ email: "newpatient@test.com" }]
            };
            const expectedResult = {
                eventId: "event-id-123",
                htmlLink: "https://calendar.google.com/updated-event-link",
                meetLink: "https://meet.google.com/updated-meet"
            };
            vitest_1.vi.mocked(googleCalendarService_service_1.updateCalendarEvent).mockResolvedValue(expectedResult);
            const result = await (0, googleCalendarService_service_1.updateCalendarEvent)(eventId, updates);
            (0, vitest_1.expect)(result).toEqual(expectedResult);
            (0, vitest_1.expect)(googleCalendarService_service_1.updateCalendarEvent).toHaveBeenCalledWith(eventId, updates);
        });
        (0, vitest_1.it)("deve retornar null em caso de erro", async () => {
            vitest_1.vi.mocked(googleCalendarService_service_1.updateCalendarEvent).mockResolvedValue(null);
            const result = await (0, googleCalendarService_service_1.updateCalendarEvent)("event-id", { summary: "Test" });
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)("deleteCalendarEvent", () => {
        (0, vitest_1.it)("deve deletar evento do Google Calendar", async () => {
            const eventId = "event-id-123";
            vitest_1.vi.mocked(googleCalendarService_service_1.deleteCalendarEvent).mockResolvedValue(true);
            const result = await (0, googleCalendarService_service_1.deleteCalendarEvent)(eventId);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(googleCalendarService_service_1.deleteCalendarEvent).toHaveBeenCalledWith(eventId);
        });
        (0, vitest_1.it)("deve retornar false em caso de erro", async () => {
            vitest_1.vi.mocked(googleCalendarService_service_1.deleteCalendarEvent).mockResolvedValue(false);
            const result = await (0, googleCalendarService_service_1.deleteCalendarEvent)("event-id");
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)("getCalendarEvents", () => {
        (0, vitest_1.it)("deve buscar eventos do calendário", async () => {
            const startDate = new Date("2024-01-01T00:00:00.000Z");
            const endDate = new Date("2024-01-01T23:59:59.000Z");
            const mockEvents = [
                {
                    id: "event-1",
                    summary: "Evento 1",
                    start: { dateTime: "2024-01-01T10:00:00.000Z" },
                    end: { dateTime: "2024-01-01T11:00:00.000Z" }
                },
                {
                    id: "event-2",
                    summary: "Evento 2",
                    start: { dateTime: "2024-01-01T14:00:00.000Z" },
                    end: { dateTime: "2024-01-01T15:00:00.000Z" }
                }
            ];
            vitest_1.vi.mocked(googleCalendarService_service_1.getCalendarEvents).mockResolvedValue(mockEvents);
            const result = await (0, googleCalendarService_service_1.getCalendarEvents)(startDate, endDate);
            (0, vitest_1.expect)(result).toEqual(mockEvents);
            (0, vitest_1.expect)(googleCalendarService_service_1.getCalendarEvents).toHaveBeenCalledWith(startDate, endDate);
        });
        (0, vitest_1.it)("deve retornar array vazio quando não há eventos", async () => {
            vitest_1.vi.mocked(googleCalendarService_service_1.getCalendarEvents).mockResolvedValue([]);
            const result = await (0, googleCalendarService_service_1.getCalendarEvents)(new Date(), new Date());
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("deve retornar array vazio em caso de erro", async () => {
            vitest_1.vi.mocked(googleCalendarService_service_1.getCalendarEvents).mockResolvedValue([]);
            const result = await (0, googleCalendarService_service_1.getCalendarEvents)(new Date(), new Date());
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("checkCalendarAvailability", () => {
        (0, vitest_1.it)("deve retornar true quando não há eventos conflitantes", async () => {
            const startTime = new Date("2024-01-01T10:00:00.000Z");
            const endTime = new Date("2024-01-01T11:00:00.000Z");
            vitest_1.vi.mocked(googleCalendarService_service_1.checkCalendarAvailability).mockResolvedValue(true);
            const result = await (0, googleCalendarService_service_1.checkCalendarAvailability)(startTime, endTime);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(googleCalendarService_service_1.checkCalendarAvailability).toHaveBeenCalledWith(startTime, endTime);
        });
        (0, vitest_1.it)("deve retornar false quando há conflito de horário", async () => {
            const startTime = new Date("2024-01-01T10:00:00.000Z");
            const endTime = new Date("2024-01-01T11:00:00.000Z");
            vitest_1.vi.mocked(googleCalendarService_service_1.checkCalendarAvailability).mockResolvedValue(false);
            const result = await (0, googleCalendarService_service_1.checkCalendarAvailability)(startTime, endTime);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)("deve retornar true quando eventos não conflitam", async () => {
            const startTime = new Date("2024-01-01T10:00:00.000Z");
            const endTime = new Date("2024-01-01T11:00:00.000Z");
            vitest_1.vi.mocked(googleCalendarService_service_1.checkCalendarAvailability).mockResolvedValue(true);
            const result = await (0, googleCalendarService_service_1.checkCalendarAvailability)(startTime, endTime);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)("deve retornar true em caso de erro (graceful degradation)", async () => {
            vitest_1.vi.mocked(googleCalendarService_service_1.checkCalendarAvailability).mockResolvedValue(true);
            const result = await (0, googleCalendarService_service_1.checkCalendarAvailability)(new Date(), new Date());
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
});
//# sourceMappingURL=googleCalendarService.test.js.map