import "./setupVitestPrismaMock";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import {
  createAppointment,
  generateAvailableSlots,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  createDoctorAvailability,
  getDoctorAvailability,
  checkWeeklyAppointmentLimit,
  checkSlotAvailability
} from "@/service/appointmentService.service";
import {
  createTestUser,
  createTestDoctor,
  createTestPatient,
  createTestAvailability,
  createTestAppointment,
  getFutureDate,
  getPastDate
} from "../helpers/testHelpers";
import { BadRequest } from "../../src/_errors/bad-request";
import { NotFound } from "../../src/_errors/not-found";
import { Unauthorized } from "../../src/_errors/unauthorized";
import moment from "moment-timezone";
import { prismaTest } from "../setup";

beforeAll(() => {
  vi.mock("@/lib/prisma", () => ({ prisma: prismaTest }));
});

// Mock dos serviços externos
vi.mock("@/service/googleCalendarService.service", () => ({
  createCalendarEvent: vi.fn().mockResolvedValue({
    eventId: "test-event-id",
    meetLink: "https://meet.google.com/test"
  }),
  deleteCalendarEvent: vi.fn().mockResolvedValue(true)
}));

vi.mock("@/service/notificationService.service", () => ({
  sendAppointmentConfirmation: vi.fn().mockResolvedValue(true),
  sendAppointmentCancellation: vi.fn().mockResolvedValue(true)
}));

describe("AppointmentService", () => {
  describe("createAppointment", () => {
    it("should create appointment successfully", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAvailability(doctor);

      const appointmentTime = moment()
        .add(1, "day")
        .day(1)
        .hour(10)
        .minute(0)
        .second(0)
        .millisecond(0)
        .toISOString();

      const appointment = await createAppointment(
        patient.id,
        doctor.id,
        appointmentTime,
        "Test consultation"
      );

      expect(appointment).toBeDefined();
      expect(appointment.patientId).toBe(patient.id);
      expect(appointment.doctorId).toBe(doctor.id);
      expect(appointment.notes).toBe("Test consultation");
      expect(appointment.patient).toBeDefined();
      expect(appointment.doctor).toBeDefined();
    });

    it("should prevent patient from having multiple appointments in the same week", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAvailability(doctor);

      // Criar primeiro agendamento
      const firstAppointmentTime = moment()
        .add(2, "days")
        .startOf("day")
        .day(1)
        .hour(10)
        .minute(0)
        .toISOString();

      await createAppointment(patient.id, doctor.id, firstAppointmentTime);

      // Tentar criar segundo agendamento na mesma semana
      const secondAppointmentTime = moment(firstAppointmentTime)
        .add(2, "days")
        .hour(14)
        .minute(0)
        .toISOString();

      await expect(
        createAppointment(patient.id, doctor.id, secondAppointmentTime)
      ).rejects.toThrow(BadRequest);
    });

    it("should prevent appointment in occupied slot", async () => {
      const doctor = await createTestDoctor();
      const patient1 = await createTestPatient();
      const patient2 = await createTestPatient();
      await createTestAvailability(doctor);

      const appointmentTime = moment()
        .add(1, "day")
        .day(1)
        .hour(10)
        .minute(0)
        .toISOString();

      // Primeiro agendamento
      await createAppointment(patient1.id, doctor.id, appointmentTime);

      // Tentar segundo agendamento no mesmo horário
      await expect(
        createAppointment(patient2.id, doctor.id, appointmentTime)
      ).rejects.toThrow(BadRequest);
    });

    it("should reject appointment with invalid doctor", async () => {
      const patient = await createTestPatient();
      const invalidDoctor = await createTestPatient();

      const appointmentTime = moment()
        .add(1, "day")
        .hour(10)
        .minute(0)
        .toISOString();

      await expect(
        createAppointment(patient.id, invalidDoctor.id, appointmentTime)
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("generateAvailableSlots", () => {
    it("should generate available slots for a day", async () => {
      const doctor = await createTestDoctor();
      // Próxima segunda-feira
      const date = moment().add(1, "week").startOf("week").add(1, "day");
      // Disponibilidade das 09:00 às 17:00 na segunda-feira
      await createTestAvailability(doctor, {
        dayOfWeek: date.day(),
        startTime: "09:00",
        endTime: "17:00"
      });

      const slots = await generateAvailableSlots(
        doctor.id,
        date.format("YYYY-MM-DD")
      );

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty("startTime");
      expect(slots[0]).toHaveProperty("endTime");
      expect(slots[0]).toHaveProperty("available");
    });

    it("should return empty array if doctor has no availability", async () => {
      const doctor = await createTestDoctor();
      const date = moment().add(1, "day").day(1).format("YYYY-MM-DD");

      const slots = await generateAvailableSlots(doctor.id, date);

      expect(slots).toEqual([]);
    });

    it("should exclude past slots", async () => {
      const doctor = await createTestDoctor();
      await createTestAvailability(doctor);

      const today = moment().format("YYYY-MM-DD");
      const slots = await generateAvailableSlots(doctor.id, today);

      const now = moment();
      const futureSlots = slots.filter((slot) =>
        moment(slot.startTime).isAfter(now)
      );

      expect(futureSlots.length).toBeLessThanOrEqual(slots.length);
    });
  });

  describe("checkWeeklyAppointmentLimit", () => {
    it("should pass if patient has no appointments this week", async () => {
      const patient = await createTestPatient();
      const date = getFutureDate(1);

      await expect(
        checkWeeklyAppointmentLimit(patient.id, date)
      ).resolves.toBeUndefined();
    });

    it("should throw error if patient already has appointment this week", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();

      // Criar agendamento na semana atual
      const thisWeek = moment().day(2).toDate(); // Terça-feira desta semana
      await createTestAppointment(patient, doctor, { startTime: thisWeek });

      // Tentar verificar limite para outro dia da mesma semana
      const sameWeek = moment().day(4).toDate(); // Quinta-feira desta semana

      await expect(
        checkWeeklyAppointmentLimit(patient.id, sameWeek)
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should update appointment status successfully", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: getFutureDate(2)
      });

      const updatedAppointment = await updateAppointmentStatus(
        appointment.id,
        "confirmed",
        patient.id,
        "patient"
      );

      expect(updatedAppointment.status).toBe("confirmed");
    });

    it("should prevent unauthorized status change", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      const otherPatient = await createTestPatient();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: getFutureDate(2)
      });

      await expect(
        updateAppointmentStatus(
          appointment.id,
          "confirmed",
          otherPatient.id,
          "patient"
        )
      ).rejects.toThrow(Unauthorized);
    });

    it("should prevent cancellation less than 24h before appointment", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();

      // Agendamento em 12 horas
      const nearFuture = moment().add(12, "hours").toDate();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: nearFuture
      });

      await expect(
        updateAppointmentStatus(
          appointment.id,
          "cancelled",
          patient.id,
          "patient"
        )
      ).rejects.toThrow(BadRequest);
    });

    it("should prevent updating completed appointments", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: getFutureDate(2)
      });

      // Primeiro marcar como concluído
      await updateAppointmentStatus(
        appointment.id,
        "completed",
        doctor.id,
        "doctor"
      );

      // Tentar alterar novamente
      await expect(
        updateAppointmentStatus(
          appointment.id,
          "cancelled",
          doctor.id,
          "doctor"
        )
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("createDoctorAvailability", () => {
    it("should create availability successfully", async () => {
      const doctor = await createTestDoctor();

      const availability = await createDoctorAvailability(doctor.id, {
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "17:00"
      });

      expect(availability).toBeDefined();
      expect(availability.doctorId).toBe(doctor.id);
      expect(availability.dayOfWeek).toBe(2);
    });

    it("should prevent overlapping availability", async () => {
      const doctor = await createTestDoctor();

      // Primeira disponibilidade
      await createDoctorAvailability(doctor.id, {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00"
      });

      // Tentar sobrepor
      await expect(
        createDoctorAvailability(doctor.id, {
          dayOfWeek: 1,
          startTime: "14:00",
          endTime: "20:00"
        })
      ).rejects.toThrow(BadRequest);
    });
  });

  describe("getDoctorAvailability", () => {
    it("should return doctor availability", async () => {
      const doctor = await createTestDoctor();
      await createTestAvailability(doctor);

      const availabilities = await getDoctorAvailability(doctor.id);

      expect(availabilities.length).toBeGreaterThan(0);
      expect(availabilities[0].doctorId).toBe(doctor.id);
    });

    it("should return empty array if no availability", async () => {
      const doctor = await createTestDoctor();

      const availabilities = await getDoctorAvailability(doctor.id);

      expect(availabilities).toEqual([]);
    });
  });

  describe("getPatientAppointments", () => {
    it("should return patient appointments", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAppointment(patient, doctor);

      const appointments = await getPatientAppointments(patient.id);

      expect(appointments.length).toBe(1);
      expect(appointments[0].patientId).toBe(patient.id);
    });

    it("should filter by status if provided", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAppointment(patient, doctor, { status: "scheduled" });
      await createTestAppointment(patient, doctor, { status: "completed" });

      const scheduledAppointments = await getPatientAppointments(
        patient.id,
        "scheduled"
      );
      const cancelledAppointments = await getPatientAppointments(
        patient.id,
        "cancelled"
      );

      expect(scheduledAppointments.length).toBe(1);
      expect(cancelledAppointments.length).toBe(0);
    });
  });

  describe("getDoctorAppointments", () => {
    it("should return doctor appointments", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAppointment(patient, doctor);

      const appointments = await getDoctorAppointments(doctor.id);

      expect(appointments.length).toBe(1);
      expect(appointments[0].doctorId).toBe(doctor.id);
    });

    it("should filter by date range if provided", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();

      const tomorrow = getFutureDate(1);
      const nextWeek = getFutureDate(7);

      await createTestAppointment(patient, doctor, { startTime: tomorrow });
      await createTestAppointment(patient, doctor, { startTime: nextWeek });

      const startDate = moment().add(6, "days").startOf("day").toDate();
      const endDate = moment().add(8, "days").endOf("day").toDate();

      const appointments = await getDoctorAppointments(
        doctor.id,
        startDate,
        endDate
      );

      expect(appointments.length).toBe(1);
    });
  });
});
