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

// src/routes/attendance/attendanceRoutes.ts
var attendanceRoutes_exports = {};
__export(attendanceRoutes_exports, {
  attendanceRoutes: () => attendanceRoutes
});
module.exports = __toCommonJS(attendanceRoutes_exports);

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/controllers/attendanceController.ts
async function postAttendance(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem registrar atendimentos"
    });
  }
  const { patientId, description, date } = request.body;
  const attendance = await prisma.attendance.create({
    data: {
      patientId,
      doctorId,
      description,
      date: date ? new Date(date) : void 0
    },
    include: {
      patient: true,
      doctor: true
    }
  });
  return reply.status(201).send({
    status: "success",
    data: attendance
  });
}
async function getMyAttendances(request, reply) {
  const { id: userId, register } = request.usuario;
  let where = {};
  if (register === "doctor") {
    where = { doctorId: userId };
  } else {
    where = { patientId: userId };
  }
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
async function getPatientAttendances(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem acessar o hist\xF3rico de pacientes"
    });
  }
  const { id: patientId } = request.params;
  const attendances = await prisma.attendance.findMany({
    where: { patientId },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}

// src/docs/attendance.ts
var import_v42 = require("zod/v4");

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
    const { userId, register } = request.user;
    request.usuario = {
      id: userId,
      register
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
var import_v4 = require("zod/v4");
var headersSchema = import_v4.z.object({
  authorization: import_v4.z.string()
});

// src/docs/attendance.ts
var errorResponseSchema = import_v42.z.object({
  status: import_v42.z.literal("error"),
  message: import_v42.z.string()
});
var attendanceSchema = import_v42.z.object({
  id: import_v42.z.string(),
  patientId: import_v42.z.string(),
  doctorId: import_v42.z.string(),
  description: import_v42.z.string(),
  date: import_v42.z.string(),
  createdAt: import_v42.z.string(),
  updatedAt: import_v42.z.string(),
  patient: import_v42.z.object({
    id: import_v42.z.string(),
    name: import_v42.z.string().nullish(),
    email: import_v42.z.string(),
    phone: import_v42.z.string().nullish()
  }).optional(),
  doctor: import_v42.z.object({
    id: import_v42.z.string(),
    name: import_v42.z.string().nullish(),
    email: import_v42.z.string(),
    phone: import_v42.z.string().nullish()
  }).optional()
});
var createAttendanceSchema = import_v42.z.object({
  patientId: import_v42.z.string(),
  description: import_v42.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_v42.z.string().optional()
  // pode ser preenchido automaticamente
});
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
      201: import_v42.z.object({
        status: import_v42.z.literal("success"),
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
      200: import_v42.z.object({
        status: import_v42.z.literal("success"),
        data: import_v42.z.array(attendanceSchema)
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
    params: import_v42.z.object({
      id: import_v42.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_v42.z.object({
        status: import_v42.z.literal("success"),
        data: import_v42.z.array(attendanceSchema)
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};

// src/routes/attendance/attendanceRoutes.ts
async function attendanceRoutes(app) {
  app.withTypeProvider().post("/attendances", {
    schema: attendanceDocs.postAttendance.schema,
    preHandler: attendanceDocs.postAttendance.preHandler,
    handler: postAttendance
  });
  app.withTypeProvider().get("/attendances/my", {
    schema: attendanceDocs.getMyAttendances.schema,
    preHandler: attendanceDocs.getMyAttendances.preHandler,
    handler: getMyAttendances
  });
  app.withTypeProvider().get("/attendances/patient/:id", {
    schema: attendanceDocs.getPatientAttendances.schema,
    preHandler: attendanceDocs.getPatientAttendances.preHandler,
    handler: getPatientAttendances
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  attendanceRoutes
});
