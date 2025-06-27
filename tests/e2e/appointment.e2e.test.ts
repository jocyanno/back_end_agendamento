import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";
import { createTestServer } from "../helpers/testServer";
import {
  createTestDoctor,
  createTestPatient,
  createTestAvailability,
  createTestAppointment,
  createAuthHeaders,
  getFutureDate
} from "../helpers/testHelpers";
import moment from "moment-timezone";

// Mock dos serviços externos para os testes e2e
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

describe("Appointment Routes E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /appointments", () => {
    it("should create appointment successfully", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      await createTestAvailability(doctor.id);

      const appointmentTime = moment()
        .add(1, "day")
        .day(1)
        .hour(10)
        .minute(0)
        .toISOString();

      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        headers: createAuthHeaders(patient.id, patient.register),
        payload: {
          doctorId: doctor.id,
          startTime: appointmentTime,
          notes: "Test consultation"
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.patientId).toBe(patient.id);
      expect(result.data.doctorId).toBe(doctor.id);
      expect(result.data.notes).toBe("Test consultation");
    });

    it("should prevent doctor from creating appointments", async () => {
      const doctor = await createTestDoctor();

      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        headers: createAuthHeaders(doctor.id, doctor.register),
        payload: {
          doctorId: doctor.id,
          startTime: moment().add(1, "day").toISOString(),
          notes: "Test"
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        payload: {
          doctorId: "doctor-id",
          startTime: moment().add(1, "day").toISOString()
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /appointments/available-slots", () => {
    it("should return available slots", async () => {
      const doctor = await createTestDoctor();
      await createTestAvailability(doctor.id);

      const date = moment().add(1, "day").day(1).format("YYYY-MM-DD");

      const response = await app.inject({
        method: "GET",
        url: `/appointments/available-slots?doctorId=${doctor.id}&date=${date}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should validate query parameters", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/available-slots"
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /appointments/my", () => {
    it("should return patient appointments", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      console.log("E2E patient:", patient.id, patient.email, patient.register);
      console.log("E2E doctor:", doctor.id, doctor.email, doctor.register);
      await createTestAppointment(patient, doctor);

      const response = await app.inject({
        method: "GET",
        url: "/appointments/my",
        headers: createAuthHeaders(patient.id, patient.register)
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].patientId).toBe(patient.id);
    });

    it("should return doctor appointments", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      console.log("E2E patient:", patient.id, patient.email, patient.register);
      console.log("E2E doctor:", doctor.id, doctor.email, doctor.register);
      await createTestAppointment(patient, doctor);

      const response = await app.inject({
        method: "GET",
        url: "/appointments/my",
        headers: createAuthHeaders(doctor.id, doctor.register)
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].doctorId).toBe(doctor.id);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/my"
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /appointments/today", () => {
    it("should return today appointments for doctor", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();

      // Criar agendamento para hoje
      const today = moment().hour(14).minute(0).second(0).toDate();
      await createTestAppointment(patient, doctor, { startTime: today });

      const response = await app.inject({
        method: "GET",
        url: "/appointments/today",
        headers: createAuthHeaders(doctor.id, doctor.register)
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should require doctor authentication", async () => {
      const patient = await createTestPatient();

      const response = await app.inject({
        method: "GET",
        url: "/appointments/today",
        headers: createAuthHeaders(patient.id, patient.register)
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /appointments/:id/status", () => {
    it("should update appointment status", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: getFutureDate(2)
      });

      const response = await app.inject({
        method: "PUT",
        url: `/appointments/${appointment.id}/status`,
        headers: createAuthHeaders(patient.id, patient.register),
        payload: {
          status: "confirmed"
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.status).toBe("confirmed");
    });

    it("should prevent unauthorized status change", async () => {
      const doctor = await createTestDoctor();
      const patient = await createTestPatient();
      const otherPatient = await createTestPatient();
      const appointment = await createTestAppointment(patient, doctor, {
        startTime: getFutureDate(2)
      });

      const response = await app.inject({
        method: "PUT",
        url: `/appointments/${appointment.id}/status`,
        headers: createAuthHeaders(otherPatient.id, otherPatient.register),
        payload: {
          status: "confirmed"
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/appointments/appointment-id/status",
        payload: {
          status: "confirmed"
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /availability", () => {
    it("should create doctor availability", async () => {
      const doctor = await createTestDoctor();

      const response = await app.inject({
        method: "POST",
        url: "/availability",
        headers: createAuthHeaders(doctor.id, doctor.register),
        payload: {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "17:00"
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.doctorId).toBe(doctor.id);
      expect(result.data.dayOfWeek).toBe(2);
    });

    it("should require doctor authentication", async () => {
      const patient = await createTestPatient();

      const response = await app.inject({
        method: "POST",
        url: "/availability",
        headers: createAuthHeaders(patient.id, patient.register),
        payload: {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "17:00"
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /availability/:doctorId", () => {
    it("should return doctor availability", async () => {
      const doctor = await createTestDoctor();
      await createTestAvailability(doctor.id);

      const response = await app.inject({
        method: "GET",
        url: `/availability/${doctor.id}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].doctorId).toBe(doctor.id);
    });

    it("should return empty array for doctor without availability", async () => {
      const doctor = await createTestDoctor();

      const response = await app.inject({
        method: "GET",
        url: `/availability/${doctor.id}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);
    });
  });
});
