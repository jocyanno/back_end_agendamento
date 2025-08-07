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

// src/docs/attendance.ts
var attendance_exports = {};
__export(attendance_exports, {
  attendanceDocs: () => attendanceDocs,
  attendanceSchema: () => attendanceSchema,
  createAttendanceSchema: () => createAttendanceSchema
});
module.exports = __toCommonJS(attendance_exports);
var import_zod2 = require("zod");

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

// src/docs/attendance.ts
var errorResponseSchema = import_zod2.z.object({
  status: import_zod2.z.literal("error"),
  message: import_zod2.z.string()
});
var attendanceSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  patientId: import_zod2.z.string(),
  doctorId: import_zod2.z.string(),
  description: import_zod2.z.string(),
  date: import_zod2.z.string(),
  createdAt: import_zod2.z.string(),
  updatedAt: import_zod2.z.string(),
  patient: import_zod2.z.object({
    id: import_zod2.z.string(),
    name: import_zod2.z.string().nullish(),
    email: import_zod2.z.string(),
    phone: import_zod2.z.string().nullish()
  }).optional(),
  doctor: import_zod2.z.object({
    id: import_zod2.z.string(),
    name: import_zod2.z.string().nullish(),
    email: import_zod2.z.string(),
    phone: import_zod2.z.string().nullish()
  }).optional()
});
var createAttendanceSchema = import_zod2.z.object({
  patientId: import_zod2.z.string(),
  description: import_zod2.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_zod2.z.string().optional()
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
      201: import_zod2.z.object({
        status: import_zod2.z.literal("success"),
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
      200: import_zod2.z.object({
        status: import_zod2.z.literal("success"),
        data: import_zod2.z.array(attendanceSchema)
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
    params: import_zod2.z.object({
      id: import_zod2.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_zod2.z.object({
        status: import_zod2.z.literal("success"),
        data: import_zod2.z.array(attendanceSchema)
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
  attendanceDocs,
  attendanceSchema,
  createAttendanceSchema
});
