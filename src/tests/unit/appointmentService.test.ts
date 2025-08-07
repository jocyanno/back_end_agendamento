import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAppointment,
  checkSlotAvailability,
  generateAvailableSlots,
  getPatientAppointments,
  updateAppointmentStatus,
  cancelAppointmentByAttendant,
  canPatientScheduleWithProfessional,
  getAppointmentById
} from "@/service/appointmentService.service";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";
import { Unauthorized } from "@/_errors/unauthorized";
import { AppointmentStatus } from "@prisma/client";

// Mock do Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    availability: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    users: {
      findUnique: vi.fn()
    }
  }
}));

// Mock do moment
vi.mock("moment-timezone", () => ({
  default: vi.fn(() => ({
    tz: vi.fn().mockReturnThis(),
    startOf: vi.fn().mockReturnThis(),
    endOf: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date("2024-01-01T08:00:00.000Z")),
    format: vi.fn(() => "2024-01-01T08:00:00.000Z"),
    isBefore: vi.fn(() => false),
    isAfter: vi.fn(() => false),
    isSame: vi.fn(() => false),
    isSameOrBefore: vi.fn(() => true),
    clone: vi.fn().mockReturnThis(),
    hour: vi.fn().mockReturnThis(),
    minute: vi.fn().mockReturnThis(),
    second: vi.fn().mockReturnThis(),
    millisecond: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    subtract: vi.fn().mockReturnThis(),
    day: vi.fn(() => 1),
    diff: vi.fn(() => 25),
    toISOString: vi.fn(() => "2024-01-01T08:00:00.000Z")
  }))
}));

// Mock dos serviços externos
vi.mock("@/service/notificationService.service", () => ({
  sendAppointmentConfirmation: vi.fn(),
  sendAppointmentCancellation: vi.fn()
}));

import { prisma } from "@/lib/prisma";

describe("appointmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkSlotAvailability", () => {
    it("deve permitir agendamento em horário livre", async () => {
      // Mock da disponibilidade do médico
      vi.mocked(prisma.availability.findFirst).mockResolvedValue({
        id: "availability-id",
        doctorId: "doctor-id",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);

      await expect(
        checkSlotAvailability("doctor-id", new Date(), new Date())
      ).resolves.not.toThrow();
    });

    it("deve lançar erro se horário estiver ocupado", async () => {
      // Mock da disponibilidade do médico
      vi.mocked(prisma.availability.findFirst).mockResolvedValue({
        id: "availability-id",
        doctorId: "doctor-id",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
        id: "appointment-id",
        patientId: "patient-id",
        doctorId: "doctor-id",
        startTime: new Date(),
        endTime: new Date(),
        status: "scheduled" as AppointmentStatus,
        patient: {
          id: "patient-id",
          name: "Test Patient"
        }
      } as any);

      await expect(
        checkSlotAvailability("doctor-id", new Date(), new Date())
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("generateAvailableSlots", () => {
    it("deve retornar slots vazios se médico não tiver disponibilidade", async () => {
      vi.mocked(prisma.availability.findFirst).mockResolvedValue(null);

      const slots = await generateAvailableSlots("doctor-id", "2024-01-01");

      expect(slots).toEqual([]);
    });

    it("deve gerar slots disponíveis corretamente", async () => {
      vi.mocked(prisma.availability.findFirst).mockResolvedValue({
        id: "availability-id",
        doctorId: "doctor-id",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await generateAvailableSlots("doctor-id", "2024-01-01");

      expect(Array.isArray(slots)).toBe(true);
    });
  });

  describe("createAppointment", () => {
    it("deve criar agendamento com dados válidos", async () => {
      const mockPatient = {
        id: "patient-id",
        email: "patient@test.com",
        register: "patient" as const
      };

      const mockDoctor = {
        id: "doctor-id",
        email: "doctor@test.com",
        register: "doctor" as const
      };

      const mockAppointment = {
        id: "appointment-id",
        patientId: "patient-id",
        doctorId: "doctor-id",
        startTime: new Date(),
        endTime: new Date(),
        status: "scheduled" as AppointmentStatus,
        notes: "Test notes",
        patient: mockPatient,
        doctor: mockDoctor
      };

      vi.mocked(prisma.users.findUnique)
        .mockResolvedValueOnce(mockPatient as any)
        .mockResolvedValueOnce(mockDoctor as any);

      // Mock da disponibilidade do médico
      vi.mocked(prisma.availability.findFirst).mockResolvedValue({
        id: "availability-id",
        doctorId: "doctor-id",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.create).mockResolvedValue(
        mockAppointment as any
      );
      vi.mocked(prisma.appointment.update).mockResolvedValue(
        mockAppointment as any
      );

      const result = await createAppointment({
        patientId: "patient-id",
        doctorId: "doctor-id",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        notes: "Test notes"
      });

      expect(result).toEqual(mockAppointment);
    });

    it("deve lançar erro se paciente não existir", async () => {
      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      await expect(
        createAppointment({
          patientId: "invalid-patient-id",
          doctorId: "doctor-id",
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        })
      ).rejects.toThrow("Paciente não encontrado");
    });

    it("deve lançar erro se médico não existir", async () => {
      const mockPatient = {
        id: "patient-id",
        email: "patient@test.com",
        register: "patient" as const
      };

      vi.mocked(prisma.users.findUnique)
        .mockResolvedValueOnce(mockPatient as any)
        .mockResolvedValueOnce(null);

      await expect(
        createAppointment({
          patientId: "patient-id",
          doctorId: "invalid-doctor-id",
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        })
      ).rejects.toThrow("Médico não encontrado");
    });
  });

  describe("getPatientAppointments", () => {
    it("deve retornar agendamentos do paciente", async () => {
      const mockAppointments = [
        {
          id: "appointment-id",
          patientId: "patient-id",
          doctorId: "doctor-id",
          startTime: new Date(),
          endTime: new Date(),
          status: "scheduled" as AppointmentStatus
        }
      ];

      vi.mocked(prisma.appointment.findMany).mockResolvedValue(
        mockAppointments as any
      );

      const result = await getPatientAppointments("patient-id");

      // Agora esperamos strings ISO em vez de objetos Date
      expect(result[0].startTime).toBe("2024-01-01T08:00:00.000Z");
      expect(result[0].endTime).toBe("2024-01-01T08:00:00.000Z");
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { patientId: "patient-id" },
        select: expect.any(Object),
        orderBy: { startTime: "desc" }
      });
    });

    it("deve filtrar por status quando fornecido", async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      await getPatientAppointments("patient-id", "scheduled");

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { patientId: "patient-id", status: "scheduled" },
        select: expect.any(Object),
        orderBy: { startTime: "desc" }
      });
    });
  });

  describe("updateAppointmentStatus", () => {
    it("deve atualizar status do agendamento", async () => {
      const mockAppointment = {
        id: "appointment-id",
        patientId: "patient-id",
        doctorId: "doctor-id",
        startTime: new Date("2024-12-01T10:00:00.000Z"),
        endTime: new Date("2024-12-01T11:00:00.000Z"),
        status: "scheduled" as AppointmentStatus,
        patient: { id: "patient-id", name: "Patient" },
        doctor: { id: "doctor-id", name: "Doctor" }
      };

      const updatedAppointment = {
        ...mockAppointment,
        status: "confirmed" as AppointmentStatus
      };

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
        mockAppointment as any
      );
      vi.mocked(prisma.appointment.update).mockResolvedValue(
        updatedAppointment as any
      );

      const result = await updateAppointmentStatus(
        "appointment-id",
        "confirmed",
        "patient-id",
        "patient"
      );

      expect(result).toEqual(updatedAppointment);
    });

    it("deve lançar erro se agendamento não existir", async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

      await expect(
        updateAppointmentStatus("invalid-id", "confirmed", "user-id", "patient")
      ).rejects.toThrow(NotFound);
    });

    it("deve lançar erro se usuário não tiver permissão", async () => {
      const mockAppointment = {
        id: "appointment-id",
        patientId: "other-patient-id",
        doctorId: "doctor-id",
        status: "scheduled" as AppointmentStatus
      };

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
        mockAppointment as any
      );

      await expect(
        updateAppointmentStatus(
          "appointment-id",
          "confirmed",
          "patient-id",
          "patient"
        )
      ).rejects.toThrow(Unauthorized);
    });

    it("deve lançar erro ao tentar alterar agendamento finalizado", async () => {
      const mockAppointment = {
        id: "appointment-id",
        patientId: "patient-id",
        doctorId: "doctor-id",
        status: "completed" as AppointmentStatus
      };

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
        mockAppointment as any
      );

      await expect(
        updateAppointmentStatus(
          "appointment-id",
          "cancelled",
          "patient-id",
          "patient"
        )
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("getAppointmentById", () => {
    it("deve retornar agendamento por ID", async () => {
      const mockAppointment = {
        id: "appointment-id",
        patientId: "patient-id",
        doctorId: "doctor-id",
        startTime: new Date(),
        endTime: new Date(),
        status: "scheduled" as AppointmentStatus,
        patient: { id: "patient-id", name: "Patient" },
        doctor: { id: "doctor-id", name: "Doctor" }
      };

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
        mockAppointment as any
      );

      const result = await getAppointmentById("appointment-id");

      // Agora esperamos strings ISO em vez de objetos Date
      expect(result?.startTime).toBe("2024-01-01T08:00:00.000Z");
      expect(result?.endTime).toBe("2024-01-01T08:00:00.000Z");
    });

    it("deve retornar null se agendamento não existir", async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

      const result = await getAppointmentById("invalid-id");

      expect(result).toBeNull();
    });
  });
});
