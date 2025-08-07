import { z } from "zod";
import { autenticarToken } from "@/middlewares/auth";
import { headersSchema } from "@/utils/scheme";

const errorResponseSchema = z.object({
  status: z.literal("error"),
  message: z.string()
});

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
