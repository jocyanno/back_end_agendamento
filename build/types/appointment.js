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

// src/types/appointment.ts
var appointment_exports = {};
__export(appointment_exports, {
  appointmentStatusEnum: () => appointmentStatusEnum,
  availabilitySchema: () => availabilitySchema,
  createAppointmentSchema: () => createAppointmentSchema,
  getAvailableSlotsSchema: () => getAvailableSlotsSchema,
  responseAppointmentSchema: () => responseAppointmentSchema,
  responseAppointmentSchemaProps: () => responseAppointmentSchemaProps,
  responseAppointmentWithUsersSchema: () => responseAppointmentWithUsersSchema,
  responseAvailabilitySchema: () => responseAvailabilitySchema,
  updateAppointmentSchema: () => updateAppointmentSchema
});
module.exports = __toCommonJS(appointment_exports);
var import_v4 = require("zod/v4");
var appointmentStatusEnum = import_v4.z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);
var responseAppointmentSchemaProps = {
  id: import_v4.z.string(),
  patientId: import_v4.z.string(),
  doctorId: import_v4.z.string(),
  startTime: import_v4.z.string(),
  endTime: import_v4.z.string(),
  status: appointmentStatusEnum,
  notes: import_v4.z.string().nullish(),
  googleEventId: import_v4.z.string().nullish(),
  createdAt: import_v4.z.string(),
  updatedAt: import_v4.z.string()
};
var responseAppointmentSchema = import_v4.z.object(
  responseAppointmentSchemaProps
);
var responseAppointmentWithUsersSchema = responseAppointmentSchema.extend({
  patient: import_v4.z.object({
    id: import_v4.z.string(),
    name: import_v4.z.string().nullish(),
    email: import_v4.z.string(),
    phone: import_v4.z.string().nullish()
  }),
  doctor: import_v4.z.object({
    id: import_v4.z.string(),
    name: import_v4.z.string().nullish(),
    email: import_v4.z.string(),
    phone: import_v4.z.string().nullish()
  })
});
var createAppointmentSchema = import_v4.z.object({
  doctorId: import_v4.z.string().min(1, "ID do m\xE9dico \xE9 obrigat\xF3rio"),
  startTime: import_v4.z.string(),
  notes: import_v4.z.string().optional()
});
var updateAppointmentSchema = import_v4.z.object({
  startTime: import_v4.z.string().optional(),
  status: appointmentStatusEnum.optional(),
  notes: import_v4.z.string().optional()
});
var getAvailableSlotsSchema = import_v4.z.object({
  doctorId: import_v4.z.string().min(1, "ID do m\xE9dico \xE9 obrigat\xF3rio"),
  date: import_v4.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});
var availabilitySchema = import_v4.z.object({
  dayOfWeek: import_v4.z.number().min(0).max(6),
  startTime: import_v4.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  endTime: import_v4.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  isActive: import_v4.z.boolean().optional()
});
var responseAvailabilitySchema = availabilitySchema.extend({
  id: import_v4.z.string(),
  doctorId: import_v4.z.string(),
  createdAt: import_v4.z.string(),
  updatedAt: import_v4.z.string()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appointmentStatusEnum,
  availabilitySchema,
  createAppointmentSchema,
  getAvailableSlotsSchema,
  responseAppointmentSchema,
  responseAppointmentSchemaProps,
  responseAppointmentWithUsersSchema,
  responseAvailabilitySchema,
  updateAppointmentSchema
});
