import { z } from "zod/v4";
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

// Attendance Schemas
export const attendanceSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  description: z.string(),
  date: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  patient: z
    .object({
      id: z.string(),
      name: z.string().nullish(),
      email: z.string(),
      phone: z.string().nullish()
    })
    .optional(),
  doctor: z
    .object({
      id: z.string(),
      name: z.string().nullish(),
      email: z.string(),
      phone: z.string().nullish()
    })
    .optional()
});

export const createAttendanceSchema = z.object({
  patientId: z.string(),
  description: z.string().min(1, "Descrição obrigatória"),
  date: z.string().optional() // pode ser preenchido automaticamente
});

// Schema para criação de agendamento pelo profissional
export const createAppointmentForPatientSchema = z.object({
  patientId: z.string().describe("ID do paciente"),
  doctorId: z
    .string()
    .describe("ID do médico (pode ser o próprio médico logado)"),
  startTime: z.string().describe("Data e hora de início do agendamento"),
  notes: z.string().optional().describe("Observações sobre o agendamento")
});

export class appointmentDocs {
  static postAppointment = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Criar novo agendamento",
      description:
        "Cria um novo agendamento. Pacientes podem agendar múltiplas consultas conforme disponibilidade.",
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

  static getAvailableSlotsByPeriod = {
    schema: {
      tags: ["Appointment"],
      summary: "Buscar horários disponíveis por período",
      description:
        "Retorna os horários disponíveis de um médico em uma data específica usando startDate e endDate (compatibilidade com frontend)",
      querystring: z.object({
        startDate: z.string().describe("Data de início no formato ISO"),
        endDate: z.string().describe("Data de fim no formato ISO"),
        doctorId: z.string().describe("ID do médico")
      }),
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
        "Atualiza o status de um agendamento. Pacientes só podem alterar seus próprios agendamentos, médicos só podem alterar seus agendamentos.",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do agendamento")
      }),
      body: z.object({
        status: z.enum([
          "scheduled",
          "confirmed",
          "cancelled",
          "completed",
          "no_show"
        ])
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

  static cancelAppointmentByAttendant = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Cancelar agendamento (attendant)",
      description:
        "Permite que atendentes cancelem agendamentos. Não é possível cancelar agendamentos que já passaram ou foram finalizados.",
      headers: headersSchema,
      params: z.object({
        appointmentId: z.string().describe("ID do agendamento a ser cancelado")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseAppointmentWithUsersSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
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

  static deleteAvailability = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Availability"],
      summary: "Deletar disponibilidade do médico",
      description:
        "Deleta uma disponibilidade específica do médico logado. Não é possível deletar se houver agendamentos futuros.",
      headers: headersSchema,
      params: z.object({
        availabilityId: z
          .string()
          .describe("ID da disponibilidade a ser deletada")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.object({
            message: z.string()
          })
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
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

  static postAppointmentForPatient = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Criar agendamento para paciente (profissional)",
      description:
        "Permite que profissionais criem agendamentos para pacientes. Apenas médicos podem usar esta rota.",
      headers: headersSchema,
      body: createAppointmentForPatientSchema,
      response: {
        201: z.object({
          status: z.literal("success"),
          data: responseAppointmentWithUsersSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getUserAppointments = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Appointment"],
      summary: "Buscar agendamentos de um usuário (atendente)",
      description:
        "Permite que atendentes busquem agendamentos de um usuário específico pelo ID",
      headers: headersSchema,
      params: z.object({
        userId: z.string().describe("ID do usuário")
      }),
      querystring: z.object({
        status: z
          .enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"])
          .optional()
          .describe("Filtrar por status do agendamento")
      }),
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

  static checkPatientDoctorAvailability = {
    schema: {
      tags: ["Appointment"],
      summary: "Verificar se paciente pode agendar com profissional",
      description:
        "Verifica se um paciente pode agendar com um profissional específico (sempre permite agendamento)",
      params: z.object({
        patientId: z.string().describe("ID do paciente"),
        doctorId: z.string().describe("ID do profissional")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.object({
            canSchedule: z.boolean(),
            reason: z.string().optional(),
            existingAppointment: z
              .object({
                id: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                status: z.string(),
                doctor: z.object({
                  id: z.string(),
                  name: z.string()
                })
              })
              .optional()
          })
        }),
        500: errorResponseSchema
      }
    }
  };

  static generateAvailableSlots = {
    schema: {
      tags: ["Appointment"],
      summary: "Gerar horários disponíveis",
      description:
        "Gera horários disponíveis para um médico em uma data específica",
      params: z.object({
        doctorId: z.string().describe("ID do médico"),
        date: z.string().describe("Data no formato YYYY-MM-DD")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(
            z.object({
              time: z.string(),
              available: z.boolean()
            })
          )
        }),
        400: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };
}

export class attendanceDocs {
  static postAttendance = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Attendance"],
      summary: "Registrar atendimento",
      description:
        "Profissional registra um atendimento realizado para um paciente.",
      headers: headersSchema,
      body: createAttendanceSchema,
      response: {
        201: z.object({
          status: z.literal("success"),
          data: attendanceSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getMyAttendances = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Attendance"],
      summary: "Histórico de atendimentos do usuário",
      description:
        "Retorna todos os atendimentos realizados para o usuário logado.",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(attendanceSchema)
        }),
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getPatientAttendances = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Attendance"],
      summary: "Histórico de atendimentos de um paciente",
      description:
        "Profissional visualiza todos os atendimentos de um paciente específico.",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do paciente")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(attendanceSchema)
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };
}
