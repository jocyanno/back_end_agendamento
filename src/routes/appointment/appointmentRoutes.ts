import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  postAppointment,
  postAppointmentForPatient,
  getAvailableSlots,
  getMyAppointments,
  putAppointmentStatus,
  postAvailability,
  getAvailability,
  getTodayAppointments,
  deleteAvailability
} from "@/controllers/appointmentController";
import { appointmentDocs } from "@/docs/appointment";

export async function appointmentRoutes(app: FastifyInstance) {
  // Rotas de agendamento
  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/appointments", appointmentDocs.postAppointment, postAppointment);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/appointments/create-for-patient",
      appointmentDocs.postAppointmentForPatient,
      postAppointmentForPatient
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/appointments/available-slots",
      appointmentDocs.getAvailableSlots,
      getAvailableSlots
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/appointments/my",
      appointmentDocs.getMyAppointments,
      getMyAppointments
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/appointments/today",
      appointmentDocs.getTodayAppointments,
      getTodayAppointments
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .put(
      "/appointments/:id/status",
      appointmentDocs.putAppointmentStatus,
      putAppointmentStatus
    );

  // Rotas de disponibilidade
  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/availability", appointmentDocs.postAvailability, postAvailability);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/availability/:doctorId",
      appointmentDocs.getAvailability,
      getAvailability
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .delete(
      "/availability/:availabilityId",
      appointmentDocs.deleteAvailability,
      deleteAvailability
    );
}
