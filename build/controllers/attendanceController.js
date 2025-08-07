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

// src/controllers/attendanceController.ts
var attendanceController_exports = {};
__export(attendanceController_exports, {
  getMyAttendances: () => getMyAttendances,
  getPatientAttendances: () => getPatientAttendances,
  postAttendance: () => postAttendance
});
module.exports = __toCommonJS(attendanceController_exports);

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/controllers/attendanceController.ts
async function postAttendance(request, reply) {
  const { id: professionalId, primaryRole } = request.usuario;
  if (primaryRole !== "professional") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem registrar atendimentos"
    });
  }
  const { patientId, description, date } = request.body;
  const attendance = await prisma.attendance.create({
    data: {
      patientId,
      professionalId,
      description,
      date: date ? new Date(date) : void 0
    },
    include: {
      patient: true,
      professional: true
    }
  });
  return reply.status(201).send({
    status: "success",
    data: attendance
  });
}
async function getMyAttendances(request, reply) {
  const { id: userId, primaryRole } = request.usuario;
  let where = {};
  if (primaryRole === "professional") {
    where = { professionalId: userId };
  } else {
    where = { patientId: userId };
  }
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      patient: true,
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
async function getPatientAttendances(request, reply) {
  const { id: professionalId, primaryRole } = request.usuario;
  if (primaryRole !== "professional") {
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
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMyAttendances,
  getPatientAttendances,
  postAttendance
});
