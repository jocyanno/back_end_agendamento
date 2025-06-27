import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  postAppointment,
  getAvailableSlots,
  getMyAppointments,
  putAppointmentStatus,
  postAvailability,
  getAvailability,
  getTodayAppointments
} from "@/controllers/appointmentController";
import { AppointmentStatus } from "@prisma/client";

// Mock dos serviços
vi.mock("@/service/appointmentService.service", () => ({
  createAppointment: vi.fn(),
  generateAvailableSlots: vi.fn(),
  getPatientAppointments: vi.fn(),
  getDoctorAppointments: vi.fn(),
  updateAppointmentStatus: vi.fn(),
  createDoctorAvailability: vi.fn(),
  getDoctorAvailability: vi.fn()
}));

// Mock do moment
vi.mock("moment-timezone", () => ({
  default: vi.fn(() => ({
    tz: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    startOf: vi.fn().mockReturnThis(),
    endOf: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date("2024-01-01T00:00:00.000Z"))
  }))
}));

describe("appointmentController Integration", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
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
      status: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
    vi.clearAllMocks();
  });

  describe("postAppointment", () => {
    it("deve criar agendamento para paciente", async () => {
      const { createAppointment } = await import(
        "@/service/appointmentService.service"
      );

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
        status: "scheduled" as AppointmentStatus,
        notes: "Test appointment"
      };

      vi.mocked(createAppointment).mockResolvedValue(mockAppointment as any);

      await postAppointment(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockAppointment
      });
    });

    it("deve impedir médico de agendar para si mesmo", async () => {
      mockRequest.usuario = {
        id: "doctor-id",
        register: "doctor"
      };

      await postAppointment(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "error",
        message: "Médicos não podem agendar consultas para si mesmos"
      });
    });
  });

  describe("getAvailableSlots", () => {
    it("deve retornar slots disponíveis", async () => {
      const { generateAvailableSlots } = await import(
        "@/service/appointmentService.service"
      );

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

      vi.mocked(generateAvailableSlots).mockResolvedValue(mockSlots);

      await getAvailableSlots(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockSlots
      });
    });
  });

  describe("getMyAppointments", () => {
    it("deve retornar agendamentos do paciente", async () => {
      const { getPatientAppointments } = await import(
        "@/service/appointmentService.service"
      );

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
          status: "scheduled" as AppointmentStatus
        }
      ];

      vi.mocked(getPatientAppointments).mockResolvedValue(
        mockAppointments as any
      );

      await getMyAppointments(mockRequest as any, mockReply as FastifyReply);

      expect(getPatientAppointments).toHaveBeenCalledWith(
        "user-id",
        "scheduled"
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockAppointments
      });
    });

    it("deve retornar agendamentos do médico com filtro de data", async () => {
      const { getDoctorAppointments } = await import(
        "@/service/appointmentService.service"
      );

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
          status: "scheduled" as AppointmentStatus
        }
      ];

      vi.mocked(getDoctorAppointments).mockResolvedValue(
        mockAppointments as any
      );

      await getMyAppointments(mockRequest as any, mockReply as FastifyReply);

      expect(getDoctorAppointments).toHaveBeenCalledWith(
        "doctor-id",
        new Date("2024-01-01"),
        new Date("2024-01-02")
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
    });
  });

  describe("putAppointmentStatus", () => {
    it("deve atualizar status do agendamento", async () => {
      const { updateAppointmentStatus } = await import(
        "@/service/appointmentService.service"
      );

      mockRequest.params = { id: "appointment-id" };
      mockRequest.body = { status: "confirmed" };

      const updatedAppointment = {
        id: "appointment-id",
        patientId: "user-id",
        doctorId: "doctor-id",
        startTime: new Date("2024-01-01T10:00:00.000Z"),
        endTime: new Date("2024-01-01T11:00:00.000Z"),
        status: "confirmed" as AppointmentStatus
      };

      vi.mocked(updateAppointmentStatus).mockResolvedValue(
        updatedAppointment as any
      );

      await putAppointmentStatus(mockRequest as any, mockReply as FastifyReply);

      expect(updateAppointmentStatus).toHaveBeenCalledWith(
        "appointment-id",
        "confirmed",
        "user-id",
        "patient"
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: updatedAppointment
      });
    });
  });

  describe("postAvailability", () => {
    it("deve criar disponibilidade para médico", async () => {
      const { createDoctorAvailability } = await import(
        "@/service/appointmentService.service"
      );

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

      vi.mocked(createDoctorAvailability).mockResolvedValue(mockAvailability);

      await postAvailability(mockRequest as any, mockReply as FastifyReply);

      expect(createDoctorAvailability).toHaveBeenCalledWith("doctor-id", {
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00"
      });
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockAvailability
      });
    });

    it("deve impedir paciente de criar disponibilidade", async () => {
      mockRequest.usuario = {
        id: "patient-id",
        register: "patient"
      };

      await postAvailability(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "error",
        message: "Apenas médicos podem configurar disponibilidade"
      });
    });
  });

  describe("getAvailability", () => {
    it("deve retornar disponibilidade do médico", async () => {
      const { getDoctorAvailability } = await import(
        "@/service/appointmentService.service"
      );

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

      vi.mocked(getDoctorAvailability).mockResolvedValue(mockAvailabilities);

      await getAvailability(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(getDoctorAvailability).toHaveBeenCalledWith("doctor-id");
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockAvailabilities
      });
    });
  });

  describe("getTodayAppointments", () => {
    it("deve retornar agendamentos do dia para médico", async () => {
      const { getDoctorAppointments } = await import(
        "@/service/appointmentService.service"
      );

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
          status: "scheduled" as AppointmentStatus
        }
      ];

      vi.mocked(getDoctorAppointments).mockResolvedValue(
        mockTodayAppointments as any
      );

      await getTodayAppointments(mockRequest as any, mockReply as FastifyReply);

      expect(getDoctorAppointments).toHaveBeenCalledWith(
        "doctor-id",
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        data: mockTodayAppointments
      });
    });

    it("deve impedir paciente de acessar agendamentos do dia", async () => {
      mockRequest.usuario = {
        id: "patient-id",
        register: "patient"
      };

      await getTodayAppointments(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "error",
        message: "Apenas médicos podem acessar esta rota"
      });
    });
  });
});
