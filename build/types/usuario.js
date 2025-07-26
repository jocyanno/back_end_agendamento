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

// src/types/usuario.ts
var usuario_exports = {};
__export(usuario_exports, {
  editUsuarioByAdminSchema: () => editUsuarioByAdminSchema,
  editUsuarioSchema: () => editUsuarioSchema,
  requestUsuarioSchema: () => requestUsuarioSchema,
  responseDoctorSchema: () => responseDoctorSchema,
  responseUsuarioLoginSchema: () => responseUsuarioLoginSchema,
  responseUsuarioSchema: () => responseUsuarioSchema,
  responseUsuarioSchemaProps: () => responseUsuarioSchemaProps
});
module.exports = __toCommonJS(usuario_exports);
var import_v4 = require("zod/v4");

// src/utils/formatDate.ts
function formatDate(date) {
  if (!date) return null;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });
}

// src/types/usuario.ts
var schemaRegister = import_v4.z.enum(["patient", "parents", "doctor", "attendant"]);
var responseUsuarioSchemaProps = {
  id: import_v4.z.string(),
  name: import_v4.z.string().nullish(),
  email: import_v4.z.string().transform((value) => value.toLowerCase()),
  image: import_v4.z.string().nullish(),
  birthDate: import_v4.z.coerce.string().or(import_v4.z.date()).transform(formatDate).nullish(),
  cpf: import_v4.z.string(),
  phone: import_v4.z.string().nullish(),
  address: import_v4.z.string().nullish(),
  numberOfAddress: import_v4.z.string().nullish(),
  complement: import_v4.z.string().nullish(),
  city: import_v4.z.string().nullish(),
  state: import_v4.z.string().nullish(),
  zipCode: import_v4.z.string().nullish(),
  country: import_v4.z.string().nullish(),
  cid: import_v4.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v4.z.coerce.string().or(import_v4.z.date()).transform(formatDate).nullish(),
  updatedAt: import_v4.z.coerce.string().or(import_v4.z.date()).transform(formatDate).nullish()
};
var responseUsuarioSchema = import_v4.z.object(responseUsuarioSchemaProps);
var requestUsuarioSchema = responseUsuarioSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: import_v4.z.string().describe("Senha obrigat\xF3ria para cria\xE7\xE3o do usu\xE1rio")
});
var editUsuarioSchema = requestUsuarioSchema.partial();
var editUsuarioByAdminSchema = editUsuarioSchema.extend({
  cid: import_v4.z.string().optional().describe("CID - C\xF3digo Internacional de Doen\xE7as (apenas administradores)")
});
var responseUsuarioLoginSchema = import_v4.z.object({
  token: import_v4.z.string(),
  usuario: responseUsuarioSchema
});
var responseDoctorSchema = import_v4.z.object({
  id: import_v4.z.string(),
  name: import_v4.z.string().nullish(),
  email: import_v4.z.string().transform((value) => value.toLowerCase()),
  image: import_v4.z.string().nullish(),
  phone: import_v4.z.string().nullish(),
  address: import_v4.z.string().nullish(),
  city: import_v4.z.string().nullish(),
  state: import_v4.z.string().nullish(),
  cid: import_v4.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v4.z.coerce.string().or(import_v4.z.date()).transform(formatDate).nullish()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  editUsuarioByAdminSchema,
  editUsuarioSchema,
  requestUsuarioSchema,
  responseDoctorSchema,
  responseUsuarioLoginSchema,
  responseUsuarioSchema,
  responseUsuarioSchemaProps
});
