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
  responseProfessionalSchema: () => responseProfessionalSchema,
  responseUsuarioLoginSchema: () => responseUsuarioLoginSchema,
  responseUsuarioSchema: () => responseUsuarioSchema,
  schemaPatientCID: () => schemaPatientCID,
  schemaPatientCIDUpdate: () => schemaPatientCIDUpdate,
  schemaRegister: () => schemaRegister,
  schemaUsuario: () => schemaUsuario,
  schemaUsuarioCreate: () => schemaUsuarioCreate,
  schemaUsuarioCreateAdmin: () => schemaUsuarioCreateAdmin,
  schemaUsuarioCreateByProfessional: () => schemaUsuarioCreateByProfessional,
  schemaUsuarioUpdate: () => schemaUsuarioUpdate,
  schemaUsuarioUpdateAdmin: () => schemaUsuarioUpdateAdmin,
  schemaUsuarioUpdateByProfessional: () => schemaUsuarioUpdateByProfessional
});
module.exports = __toCommonJS(usuario_exports);
var import_zod = require("zod");
var schemaRegister = import_zod.z.enum([
  "patient",
  "parents",
  "professional",
  "attendant"
]);
var schemaUsuario = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod.z.string().email("Email inv\xE1lido"),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaUsuarioUpdate = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod.z.string().email("Email inv\xE1lido").optional(),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaPatientCID = import_zod.z.object({
  patientId: import_zod.z.string().min(1, "ID do paciente \xE9 obrigat\xF3rio"),
  professionalId: import_zod.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  organizationId: import_zod.z.string().min(1, "ID da organiza\xE7\xE3o \xE9 obrigat\xF3rio"),
  cid: import_zod.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod.z.string().optional()
});
var schemaPatientCIDUpdate = import_zod.z.object({
  cid: import_zod.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod.z.string().optional()
});
var schemaUsuarioCreate = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod.z.string().email("Email inv\xE1lido"),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaUsuarioCreateAdmin = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod.z.string().email("Email inv\xE1lido"),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaUsuarioUpdateAdmin = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaUsuarioCreateByProfessional = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod.z.string().email("Email inv\xE1lido"),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var schemaUsuarioUpdateByProfessional = import_zod.z.object({
  name: import_zod.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod.z.string().optional(),
  birthDate: import_zod.z.string().optional(),
  address: import_zod.z.string().optional(),
  numberOfAddress: import_zod.z.string().optional(),
  complement: import_zod.z.string().optional(),
  city: import_zod.z.string().optional(),
  state: import_zod.z.string().optional(),
  zipCode: import_zod.z.string().optional(),
  country: import_zod.z.string().optional(),
  image: import_zod.z.string().optional()
});
var editUsuarioSchema = schemaUsuarioUpdate;
var editUsuarioByAdminSchema = schemaUsuarioUpdateByProfessional;
var requestUsuarioSchema = schemaUsuarioCreate;
var responseProfessionalSchema = import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  email: import_zod.z.string(),
  cpf: import_zod.z.string(),
  phone: import_zod.z.string().nullable(),
  birthDate: import_zod.z.string().nullable(),
  address: import_zod.z.string().nullable(),
  numberOfAddress: import_zod.z.string().nullable(),
  complement: import_zod.z.string().nullable(),
  city: import_zod.z.string().nullable(),
  state: import_zod.z.string().nullable(),
  zipCode: import_zod.z.string().nullable(),
  country: import_zod.z.string().nullable(),
  image: import_zod.z.string().nullable(),
  primaryRole: import_zod.z.string(),
  primaryOrganizationId: import_zod.z.string().nullable(),
  organizations: import_zod.z.array(
    import_zod.z.object({
      id: import_zod.z.string(),
      name: import_zod.z.string(),
      role: import_zod.z.string()
    })
  ),
  createdAt: import_zod.z.string(),
  updatedAt: import_zod.z.string()
});
var responseUsuarioLoginSchema = import_zod.z.object({
  token: import_zod.z.string(),
  usuario: responseProfessionalSchema
});
var responseUsuarioSchema = responseProfessionalSchema;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  editUsuarioByAdminSchema,
  editUsuarioSchema,
  requestUsuarioSchema,
  responseProfessionalSchema,
  responseUsuarioLoginSchema,
  responseUsuarioSchema,
  schemaPatientCID,
  schemaPatientCIDUpdate,
  schemaRegister,
  schemaUsuario,
  schemaUsuarioCreate,
  schemaUsuarioCreateAdmin,
  schemaUsuarioCreateByProfessional,
  schemaUsuarioUpdate,
  schemaUsuarioUpdateAdmin,
  schemaUsuarioUpdateByProfessional
});
