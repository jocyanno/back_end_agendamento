import { z } from "zod";
import { formatDate } from "@/utils/formatDate";

// Enums
export const appointmentStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);

// Schema de resposta do agendamento
export const responseAppointmentSchemaProps = {
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  startTime: z.coerce.string().or(z.date()).transform(formatDate),
  endTime: z.coerce.string().or(z.date()).transform(formatDate),
  status: appointmentStatusEnum,
  notes: z.string().nullish(),
  googleEventId: z.string().nullish(),
  googleMeetLink: z.string().nullish(),
  reminderSent: z.boolean(),
  createdAt: z.coerce.string().or(z.date()).transform(formatDate),
  updatedAt: z.coerce.string().or(z.date()).transform(formatDate)
};

export const responseAppointmentSchema = z.object(
  responseAppointmentSchemaProps
);

// Schema com dados do paciente e médico
export const responseAppointmentWithUsersSchema =
  responseAppointmentSchema.extend({
    patient: z.object({
      id: z.string(),
      name: z.string().nullish(),
      email: z.string(),
      phone: z.string().nullish()
    }),
    doctor: z.object({
      id: z.string(),
      name: z.string().nullish(),
      email: z.string(),
      phone: z.string().nullish()
    })
  });

// Schema para criar agendamento
export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, "ID do médico é obrigatório"),
  startTime: z.string().datetime({ message: "Data/hora de início inválida" }),
  notes: z.string().optional()
});

// Schema para atualizar agendamento
export const updateAppointmentSchema = z.object({
  startTime: z.string().datetime().optional(),
  status: appointmentStatusEnum.optional(),
  notes: z.string().optional()
});

// Schema para buscar horários disponíveis
export const getAvailableSlotsSchema = z.object({
  doctorId: z.string().min(1, "ID do médico é obrigatório"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});

// Schema de disponibilidade do médico
export const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm"),
  isActive: z.boolean().optional()
});

export const responseAvailabilitySchema = availabilitySchema.extend({
  id: z.string(),
  doctorId: z.string(),
  createdAt: z.coerce.string().or(z.date()).transform(formatDate),
  updatedAt: z.coerce.string().or(z.date()).transform(formatDate)
});
