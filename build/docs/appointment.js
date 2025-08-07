"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/docs/appointment.ts
var appointment_exports = {};
__export(appointment_exports, {
  appointmentDocs: () => appointmentDocs,
  attendanceDocs: () => attendanceDocs,
  attendanceSchema: () => attendanceSchema,
  createAppointmentForPatientSchema: () => createAppointmentForPatientSchema,
  createAttendanceSchema: () => createAttendanceSchema
});
module.exports = __toCommonJS(appointment_exports);
var import_zod3 = require("zod");

// src/_errors/unauthorized.ts
var Unauthorized = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthorized";
  }
};

// src/middlewares/auth.ts
async function autenticarToken(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Unauthorized("Token de autentica\xE7\xE3o n\xE3o fornecido");
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new Unauthorized("Formato de token inv\xE1lido. Use: Bearer <token>");
    }
    await request.jwtVerify();
    const { userId, primaryRole, primaryOrganizationId, userOrganizations } = request.user;
    request.usuario = {
      id: userId,
      primaryRole,
      primaryOrganizationId,
      userOrganizations
    };
  } catch (error) {
    if (error instanceof Unauthorized) {
      throw error;
    }
    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      throw new Unauthorized("Token de autentica\xE7\xE3o inv\xE1lido");
    }
    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
      throw new Unauthorized("Token de autentica\xE7\xE3o expirado");
    }
    throw new Unauthorized("Falha na autentica\xE7\xE3o");
  }
}

// src/utils/scheme.ts
var import_zod = require("zod");
var headersSchema = import_zod.z.object({
  authorization: import_zod.z.string()
});

// src/types/appointment.ts
var import_zod2 = require("zod");
var appointmentStatusEnum = import_zod2.z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);
var responseAppointmentSchemaProps = {
  id: import_zod2.z.string(),
  patientId: import_zod2.z.string(),
  professionalId: import_zod2.z.string(),
  startTime: import_zod2.z.string(),
  endTime: import_zod2.z.string(),
  status: appointmentStatusEnum,
  notes: import_zod2.z.string().nullish(),
  googleEventId: import_zod2.z.string().nullish(),
  createdAt: import_zod2.z.string(),
  updatedAt: import_zod2.z.string()
};
var responseAppointmentSchema = import_zod2.z.object(
  responseAppointmentSchemaProps
);
var responseAppointmentWithUsersSchema = responseAppointmentSchema.extend({
  patient: import_zod2.z.object({
    id: import_zod2.z.string(),
    name: import_zod2.z.string().nullish(),
    email: import_zod2.z.string(),
    phone: import_zod2.z.string().nullish()
  }),
  professional: import_zod2.z.object({
    id: import_zod2.z.string(),
    name: import_zod2.z.string().nullish(),
    email: import_zod2.z.string(),
    phone: import_zod2.z.string().nullish()
  })
});
var createAppointmentSchema = import_zod2.z.object({
  professionalId: import_zod2.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  startTime: import_zod2.z.string(),
  notes: import_zod2.z.string().optional()
});
var updateAppointmentSchema = import_zod2.z.object({
  startTime: import_zod2.z.string().optional(),
  status: appointmentStatusEnum.optional(),
  notes: import_zod2.z.string().optional()
});
var getAvailableSlotsSchema = import_zod2.z.object({
  professionalId: import_zod2.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  date: import_zod2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});
var availabilitySchema = import_zod2.z.object({
  dayOfWeek: import_zod2.z.number().min(0).max(6),
  startTime: import_zod2.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  endTime: import_zod2.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  isActive: import_zod2.z.boolean().optional()
});
var responseAvailabilitySchema = availabilitySchema.extend({
  id: import_zod2.z.string(),
  professionalId: import_zod2.z.string(),
  createdAt: import_zod2.z.string(),
  updatedAt: import_zod2.z.string()
});

// src/docs/appointment.ts
var errorResponseSchema = import_zod3.z.object({
  status: import_zod3.z.literal("error"),
  message: import_zod3.z.string()
});
var attendanceSchema = import_zod3.z.object({
  id: import_zod3.z.string(),
  patientId: import_zod3.z.string(),
  doctorId: import_zod3.z.string(),
  description: import_zod3.z.string(),
  date: import_zod3.z.string(),
  createdAt: import_zod3.z.string(),
  updatedAt: import_zod3.z.string(),
  patient: import_zod3.z.object({
    id: import_zod3.z.string(),
    name: import_zod3.z.string().nullish(),
    email: import_zod3.z.string(),
    phone: import_zod3.z.string().nullish()
  }).optional(),
  doctor: import_zod3.z.object({
    id: import_zod3.z.string(),
    name: import_zod3.z.string().nullish(),
    email: import_zod3.z.string(),
    phone: import_zod3.z.string().nullish()
  }).optional()
});
var createAttendanceSchema = import_zod3.z.object({
  patientId: import_zod3.z.string(),
  description: import_zod3.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_zod3.z.string().optional()
  // pode ser preenchido automaticamente
});
var createAppointmentForPatientSchema = import_zod3.z.object({
  patientId: import_zod3.z.string().describe("ID do paciente"),
  doctorId: import_zod3.z.string().describe("ID do m\xE9dico (pode ser o pr\xF3prio m\xE9dico logado)"),
  startTime: import_zod3.z.string().describe("Data e hora de in\xEDcio do agendamento"),
  notes: import_zod3.z.string().optional().describe("Observa\xE7\xF5es sobre o agendamento")
});
var appointmentDocs = class {
};
appointmentDocs.postAppointment = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Criar novo agendamento",
    description: "Cria um novo agendamento. Pacientes podem agendar m\xFAltiplas consultas conforme disponibilidade.",
    headers: headersSchema,
    body: createAppointmentSchema,
    response: {
      201: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.getAvailableSlotsByPeriod = {
  schema: {
    tags: ["Appointment"],
    summary: "Buscar hor\xE1rios dispon\xEDveis por per\xEDodo",
    description: "Retorna os hor\xE1rios dispon\xEDveis de um m\xE9dico em uma data espec\xEDfica usando startDate e endDate (compatibilidade com frontend)",
    querystring: import_zod3.z.object({
      startDate: import_zod3.z.string().describe("Data de in\xEDcio no formato ISO"),
      endDate: import_zod3.z.string().describe("Data de fim no formato ISO"),
      doctorId: import_zod3.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            startTime: import_zod3.z.string(),
            endTime: import_zod3.z.string(),
            available: import_zod3.z.boolean()
          })
        )
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.getAvailableSlots = {
  schema: {
    tags: ["Appointment"],
    summary: "Buscar hor\xE1rios dispon\xEDveis",
    description: "Retorna os hor\xE1rios dispon\xEDveis de um m\xE9dico em uma data espec\xEDfica",
    querystring: getAvailableSlotsSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            startTime: import_zod3.z.string(),
            endTime: import_zod3.z.string(),
            available: import_zod3.z.boolean()
          })
        )
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.getMyAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Buscar meus agendamentos",
    description: "Retorna os agendamentos do usu\xE1rio logado (paciente ou m\xE9dico)",
    headers: headersSchema,
    querystring: import_zod3.z.object({
      status: appointmentStatusEnum.optional(),
      startDate: import_zod3.z.string().optional(),
      endDate: import_zod3.z.string().optional()
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.putAppointmentStatus = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Atualizar status do agendamento",
    description: "Atualiza o status de um agendamento. Pacientes s\xF3 podem alterar seus pr\xF3prios agendamentos, m\xE9dicos s\xF3 podem alterar seus agendamentos.",
    headers: headersSchema,
    params: import_zod3.z.object({
      id: import_zod3.z.string().describe("ID do agendamento")
    }),
    body: import_zod3.z.object({
      status: import_zod3.z.enum([
        "scheduled",
        "confirmed",
        "cancelled",
        "completed",
        "no_show"
      ])
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.cancelAppointmentByAttendant = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Cancelar agendamento (attendant)",
    description: "Permite que atendentes cancelem agendamentos. N\xE3o \xE9 poss\xEDvel cancelar agendamentos que j\xE1 passaram ou foram finalizados.",
    headers: headersSchema,
    params: import_zod3.z.object({
      appointmentId: import_zod3.z.string().describe("ID do agendamento a ser cancelado")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
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
appointmentDocs.postAvailability = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Availability"],
    summary: "Configurar disponibilidade",
    description: "Configura a disponibilidade do m\xE9dico para um dia da semana",
    headers: headersSchema,
    body: availabilitySchema,
    response: {
      201: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseAvailabilitySchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.getAvailability = {
  schema: {
    tags: ["Availability"],
    summary: "Buscar disponibilidade do m\xE9dico",
    description: "Retorna a disponibilidade configurada de um m\xE9dico",
    params: import_zod3.z.object({
      doctorId: import_zod3.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseAvailabilitySchema)
      }),
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.deleteAvailability = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Availability"],
    summary: "Deletar disponibilidade do m\xE9dico",
    description: "Deleta uma disponibilidade espec\xEDfica do m\xE9dico logado. N\xE3o \xE9 poss\xEDvel deletar se houver agendamentos futuros.",
    headers: headersSchema,
    params: import_zod3.z.object({
      availabilityId: import_zod3.z.string().describe("ID da disponibilidade a ser deletada")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.object({
          message: import_zod3.z.string()
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
appointmentDocs.getTodayAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Agendamentos do dia",
    description: "Retorna os agendamentos do dia para o m\xE9dico logado",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.postAppointmentForPatient = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Criar agendamento para paciente (profissional)",
    description: "Permite que profissionais criem agendamentos para pacientes. Apenas m\xE9dicos podem usar esta rota.",
    headers: headersSchema,
    body: createAppointmentForPatientSchema,
    response: {
      201: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.getUserAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Buscar agendamentos de um usu\xE1rio (atendente)",
    description: "Permite que atendentes busquem agendamentos de um usu\xE1rio espec\xEDfico pelo ID",
    headers: headersSchema,
    params: import_zod3.z.object({
      userId: import_zod3.z.string().describe("ID do usu\xE1rio")
    }),
    querystring: import_zod3.z.object({
      status: import_zod3.z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional().describe("Filtrar por status do agendamento")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.checkPatientDoctorAvailability = {
  schema: {
    tags: ["Appointment"],
    summary: "Verificar se paciente pode agendar com profissional",
    description: "Verifica se um paciente pode agendar com um profissional espec\xEDfico (sempre permite agendamento)",
    params: import_zod3.z.object({
      patientId: import_zod3.z.string().describe("ID do paciente"),
      doctorId: import_zod3.z.string().describe("ID do profissional")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.object({
          canSchedule: import_zod3.z.boolean(),
          reason: import_zod3.z.string().optional(),
          existingAppointment: import_zod3.z.object({
            id: import_zod3.z.string(),
            startTime: import_zod3.z.string(),
            endTime: import_zod3.z.string(),
            status: import_zod3.z.string(),
            doctor: import_zod3.z.object({
              id: import_zod3.z.string(),
              name: import_zod3.z.string()
            })
          }).optional()
        })
      }),
      500: errorResponseSchema
    }
  }
};
appointmentDocs.generateAvailableSlots = {
  schema: {
    tags: ["Appointment"],
    summary: "Gerar hor\xE1rios dispon\xEDveis",
    description: "Gera hor\xE1rios dispon\xEDveis para um m\xE9dico em uma data espec\xEDfica",
    params: import_zod3.z.object({
      doctorId: import_zod3.z.string().describe("ID do m\xE9dico"),
      date: import_zod3.z.string().describe("Data no formato YYYY-MM-DD")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            time: import_zod3.z.string(),
            available: import_zod3.z.boolean()
          })
        )
      }),
      400: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
appointmentDocs.fixAppointmentTimezones = {
  schema: {
    tags: ["Appointment"],
    summary: "Corrigir timezones dos agendamentos",
    description: "Corrige os timezones de todos os agendamentos existentes (usar apenas uma vez)",
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        message: import_zod3.z.string()
      }),
      500: errorResponseSchema
    }
  }
};
var attendanceDocs = class {
};
attendanceDocs.postAttendance = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Registrar atendimento",
    description: "Profissional registra um atendimento realizado para um paciente.",
    headers: headersSchema,
    body: createAttendanceSchema,
    response: {
      201: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: attendanceSchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
attendanceDocs.getMyAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos do usu\xE1rio",
    description: "Retorna todos os atendimentos realizados para o usu\xE1rio logado.",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(attendanceSchema)
      }),
      401: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
attendanceDocs.getPatientAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos de um paciente",
    description: "Profissional visualiza todos os atendimentos de um paciente espec\xEDfico.",
    headers: headersSchema,
    params: import_zod3.z.object({
      id: import_zod3.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(attendanceSchema)
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appointmentDocs,
  attendanceDocs,
  attendanceSchema,
  createAppointmentForPatientSchema,
  createAttendanceSchema
});
