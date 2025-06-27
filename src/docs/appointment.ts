import { z } from "zod/v3";
import { autenticarToken } from "@/middlewares/auth";
import { headersSchema } from "@/utils/scheme";
import {
  appointmentStatusEnum,
  createAppointmentSchema,
  updateAppointmentSchema,
  getAvailableSlotsSchema,
  availabilitySchema,
  responseAppointmentWithUsersSchema,
  responseAvailabilitySchema
} from "@/types/appointment";

const errorResponseSchema = z.object({
  status: z.literal("error"),
  message: z.string()
});

export class appointmentDocs {
  static postAppointment = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Criar novo agendamento",
      description:
        "Cria um novo agendamento. Pacientes podem agendar apenas 1 consulta por semana.",
      headers: headersSchema,
      body: createAppointmentSchema,
      response: {
        201: z.object({
          status: z.literal("success"),
          data: responseAppointmentWithUsersSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getAvailableSlots = {
    schema: {
      tags: ["Appointment"],
      summary: "Buscar horários disponíveis",
      description:
        "Retorna os horários disponíveis de um médico em uma data específica",
      querystring: getAvailableSlotsSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(
            z.object({
              startTime: z.string(),
              endTime: z.string(),
              available: z.boolean()
            })
          )
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getMyAppointments = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Buscar meus agendamentos",
      description:
        "Retorna os agendamentos do usuário logado (paciente ou médico)",
      headers: headersSchema,
      querystring: z.object({
        status: appointmentStatusEnum.optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseAppointmentWithUsersSchema)
        }),
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static putAppointmentStatus = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Atualizar status do agendamento",
      description:
        "Atualiza o status de um agendamento. Cancelamentos devem ser feitos com 24h de antecedência.",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do agendamento")
      }),
      body: z.object({
        status: appointmentStatusEnum
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseAppointmentWithUsersSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static postAvailability = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Availability"],
      summary: "Configurar disponibilidade",
      description:
        "Configura a disponibilidade do médico para um dia da semana",
      headers: headersSchema,
      body: availabilitySchema,
      response: {
        201: z.object({
          status: z.literal("success"),
          data: responseAvailabilitySchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getAvailability = {
    schema: {
      tags: ["Availability"],
      summary: "Buscar disponibilidade do médico",
      description: "Retorna a disponibilidade configurada de um médico",
      params: z.object({
        doctorId: z.string().describe("ID do médico")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseAvailabilitySchema)
        }),
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getTodayAppointments = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Agendamentos do dia",
      description: "Retorna os agendamentos do dia para o médico logado",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseAppointmentWithUsersSchema)
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };
}
