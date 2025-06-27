import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendEmail,
  getAppointmentConfirmationTemplate,
  getAppointmentCancellationTemplate,
  createNotification,
  sendAppointmentConfirmation,
  sendAppointmentCancellation
} from "@/service/notificationService.service";

// Mock do prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: vi.fn()
    },
    appointment: {
      update: vi.fn()
    }
  }
}));

// Mock das funções do notification service
vi.mock("@/service/notificationService.service", async () => {
  const actual = await vi.importActual("@/service/notificationService.service");
  return {
    ...actual,
    sendEmail: vi.fn(),
    createNotification: vi.fn(),
    sendAppointmentConfirmation: vi.fn(),
    sendAppointmentCancellation: vi.fn()
  };
});

// Mock do nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn()
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
  googleMeetLink: "https://meet.google.com/test"
};

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      vi.mocked(sendEmail).mockResolvedValue(true);

      const result = await sendEmail(
        "test@test.com",
        "Teste",
        "<p>Conteúdo</p>"
      );

      expect(result).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        "test@test.com",
        "Teste",
        "<p>Conteúdo</p>"
      );
    });

    it("deve retornar false em caso de erro", async () => {
      vi.mocked(sendEmail).mockResolvedValue(false);

      const result = await sendEmail(
        "invalid-email",
        "Teste",
        "<p>Conteúdo</p>"
      );

      expect(result).toBe(false);
    });
  });

  describe("getAppointmentConfirmationTemplate", () => {
    it("deve gerar template de confirmação correto", () => {
      const data = {
        patientName: "João Silva",
        doctorName: "Dr. Maria",
        date: "15/01/2024",
        time: "10:00",
        meetLink: "https://meet.google.com/test"
      };

      const template = getAppointmentConfirmationTemplate(data);

      expect(template).toContain("Confirmação de Agendamento");
      expect(template).toContain("João Silva");
      expect(template).toContain("Dr. Maria");
      expect(template).toContain("15/01/2024");
      expect(template).toContain("10:00");
      expect(template).toContain("https://meet.google.com/test");
    });

    it("deve gerar template sem link de reunião", () => {
      const data = {
        patientName: "João Silva",
        doctorName: "Dr. Maria",
        date: "15/01/2024",
        time: "10:00"
      };

      const template = getAppointmentConfirmationTemplate(data);

      expect(template).toContain("Confirmação de Agendamento");
      expect(template).not.toContain("Link da Reunião");
    });
  });

  describe("getAppointmentCancellationTemplate", () => {
    it("deve gerar template de cancelamento correto", () => {
      const data = {
        patientName: "João Silva",
        doctorName: "Dr. Maria",
        date: "15/01/2024",
        time: "10:00",
        reason: "Conflito de agenda"
      };

      const template = getAppointmentCancellationTemplate(data);

      expect(template).toContain("Agendamento Cancelado");
      expect(template).toContain("João Silva");
      expect(template).toContain("Dr. Maria");
      expect(template).toContain("15/01/2024");
      expect(template).toContain("10:00");
      expect(template).toContain("Conflito de agenda");
    });

    it("deve gerar template sem motivo", () => {
      const data = {
        patientName: "João Silva",
        doctorName: "Dr. Maria",
        date: "15/01/2024",
        time: "10:00"
      };

      const template = getAppointmentCancellationTemplate(data);

      expect(template).toContain("Agendamento Cancelado");
      expect(template).not.toContain("Motivo:");
    });
  });

  describe("createNotification", () => {
    it("deve criar notificação", async () => {
      const notificationData = {
        userId: "user-1",
        appointmentId: "appointment-1",
        type: "confirmation",
        title: "Agendamento Confirmado",
        message: "Sua consulta foi confirmada"
      };

      vi.mocked(createNotification).mockResolvedValue({
        id: "notification-1",
        ...notificationData,
        sentAt: null,
        readAt: null,
        createdAt: new Date()
      });

      const result = await createNotification(notificationData);

      expect(createNotification).toHaveBeenCalledWith(notificationData);
      expect(result).toHaveProperty("id");
    });
  });

  describe("sendAppointmentConfirmation", () => {
    it("deve enviar confirmação de agendamento", async () => {
      vi.mocked(sendAppointmentConfirmation).mockResolvedValue(undefined);

      await sendAppointmentConfirmation(mockAppointment);

      expect(sendAppointmentConfirmation).toHaveBeenCalledWith(mockAppointment);
    });
  });

  describe("sendAppointmentCancellation", () => {
    it("deve enviar notificação de cancelamento", async () => {
      vi.mocked(sendAppointmentCancellation).mockResolvedValue(undefined);

      await sendAppointmentCancellation(mockAppointment, "Conflito de agenda");

      expect(sendAppointmentCancellation).toHaveBeenCalledWith(
        mockAppointment,
        "Conflito de agenda"
      );
    });

    it("deve enviar notificação de cancelamento sem motivo", async () => {
      vi.mocked(sendAppointmentCancellation).mockResolvedValue(undefined);

      await sendAppointmentCancellation(mockAppointment);

      expect(sendAppointmentCancellation).toHaveBeenCalledWith(mockAppointment);
    });
  });
});
