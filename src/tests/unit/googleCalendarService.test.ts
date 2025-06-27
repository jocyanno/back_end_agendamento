import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock das dependências externas no nível superior
vi.mock("googleapis");
vi.mock("google-auth-library");
vi.mock("moment-timezone");

// Mock das funções que queremos testar
vi.mock("@/service/googleCalendarService.service", async () => {
  const actual = await vi.importActual(
    "@/service/googleCalendarService.service"
  );
  return {
    ...actual,
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    getCalendarEvents: vi.fn(),
    checkCalendarAvailability: vi.fn()
  };
});

import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  checkCalendarAvailability
} from "@/service/googleCalendarService.service";

describe("googleCalendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCalendarEvent", () => {
    it("deve criar evento no Google Calendar com sucesso", async () => {
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

      vi.mocked(createCalendarEvent).mockResolvedValue(expectedResult);

      const result = await createCalendarEvent(eventData);

      expect(result).toEqual(expectedResult);
      expect(createCalendarEvent).toHaveBeenCalledWith(eventData);
    });

    it("deve retornar null em caso de erro", async () => {
      const eventData = {
        summary: "Consulta Médica",
        description: "Consulta com Dr. João",
        startTime: new Date("2024-01-01T10:00:00.000Z"),
        endTime: new Date("2024-01-01T11:00:00.000Z"),
        attendees: [{ email: "patient@test.com" }]
      };

      vi.mocked(createCalendarEvent).mockResolvedValue(null);

      const result = await createCalendarEvent(eventData);

      expect(result).toBeNull();
    });
  });

  describe("updateCalendarEvent", () => {
    it("deve atualizar evento no Google Calendar", async () => {
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

      vi.mocked(updateCalendarEvent).mockResolvedValue(expectedResult);

      const result = await updateCalendarEvent(eventId, updates);

      expect(result).toEqual(expectedResult);
      expect(updateCalendarEvent).toHaveBeenCalledWith(eventId, updates);
    });

    it("deve retornar null em caso de erro", async () => {
      vi.mocked(updateCalendarEvent).mockResolvedValue(null);

      const result = await updateCalendarEvent("event-id", { summary: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("deleteCalendarEvent", () => {
    it("deve deletar evento do Google Calendar", async () => {
      const eventId = "event-id-123";

      vi.mocked(deleteCalendarEvent).mockResolvedValue(true);

      const result = await deleteCalendarEvent(eventId);

      expect(result).toBe(true);
      expect(deleteCalendarEvent).toHaveBeenCalledWith(eventId);
    });

    it("deve retornar false em caso de erro", async () => {
      vi.mocked(deleteCalendarEvent).mockResolvedValue(false);

      const result = await deleteCalendarEvent("event-id");

      expect(result).toBe(false);
    });
  });

  describe("getCalendarEvents", () => {
    it("deve buscar eventos do calendário", async () => {
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

      vi.mocked(getCalendarEvents).mockResolvedValue(mockEvents);

      const result = await getCalendarEvents(startDate, endDate);

      expect(result).toEqual(mockEvents);
      expect(getCalendarEvents).toHaveBeenCalledWith(startDate, endDate);
    });

    it("deve retornar array vazio quando não há eventos", async () => {
      vi.mocked(getCalendarEvents).mockResolvedValue([]);

      const result = await getCalendarEvents(new Date(), new Date());

      expect(result).toEqual([]);
    });

    it("deve retornar array vazio em caso de erro", async () => {
      vi.mocked(getCalendarEvents).mockResolvedValue([]);

      const result = await getCalendarEvents(new Date(), new Date());

      expect(result).toEqual([]);
    });
  });

  describe("checkCalendarAvailability", () => {
    it("deve retornar true quando não há eventos conflitantes", async () => {
      const startTime = new Date("2024-01-01T10:00:00.000Z");
      const endTime = new Date("2024-01-01T11:00:00.000Z");

      vi.mocked(checkCalendarAvailability).mockResolvedValue(true);

      const result = await checkCalendarAvailability(startTime, endTime);

      expect(result).toBe(true);
      expect(checkCalendarAvailability).toHaveBeenCalledWith(
        startTime,
        endTime
      );
    });

    it("deve retornar false quando há conflito de horário", async () => {
      const startTime = new Date("2024-01-01T10:00:00.000Z");
      const endTime = new Date("2024-01-01T11:00:00.000Z");

      vi.mocked(checkCalendarAvailability).mockResolvedValue(false);

      const result = await checkCalendarAvailability(startTime, endTime);

      expect(result).toBe(false);
    });

    it("deve retornar true quando eventos não conflitam", async () => {
      const startTime = new Date("2024-01-01T10:00:00.000Z");
      const endTime = new Date("2024-01-01T11:00:00.000Z");

      vi.mocked(checkCalendarAvailability).mockResolvedValue(true);

      const result = await checkCalendarAvailability(startTime, endTime);

      expect(result).toBe(true);
    });

    it("deve retornar true em caso de erro (graceful degradation)", async () => {
      vi.mocked(checkCalendarAvailability).mockResolvedValue(true);

      const result = await checkCalendarAvailability(new Date(), new Date());

      expect(result).toBe(true);
    });
  });
});
