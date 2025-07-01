"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseDoctorSchema = exports.responseUsuarioLoginSchema = exports.editUsuarioByAdminSchema = exports.editUsuarioSchema = exports.requestUsuarioSchema = exports.responseUsuarioSchema = exports.responseUsuarioSchemaProps = void 0;
const v4_1 = require("zod/v4");
const formatDate_1 = require("@/utils/formatDate");
const schemaRegister = v4_1.z.enum(["patient", "parents", "doctor"]);
exports.responseUsuarioSchemaProps = {
    id: v4_1.z.string(),
    name: v4_1.z.string().nullish(),
    email: v4_1.z.string().transform((value) => value.toLowerCase()),
    image: v4_1.z.string().nullish(),
    birthDate: v4_1.z.coerce.string().or(v4_1.z.date()).transform(formatDate_1.formatDate).nullish(),
    cpf: v4_1.z.string(),
    phone: v4_1.z.string().nullish(),
    address: v4_1.z.string().nullish(),
    numberOfAddress: v4_1.z.string().nullish(),
    complement: v4_1.z.string().nullish(),
    city: v4_1.z.string().nullish(),
    state: v4_1.z.string().nullish(),
    zipCode: v4_1.z.string().nullish(),
    country: v4_1.z.string().nullish(),
    cid: v4_1.z.string().nullish(),
    register: schemaRegister,
    createdAt: v4_1.z.coerce.string().or(v4_1.z.date()).transform(formatDate_1.formatDate).nullish(),
    updatedAt: v4_1.z.coerce.string().or(v4_1.z.date()).transform(formatDate_1.formatDate).nullish()
};
exports.responseUsuarioSchema = v4_1.z.object(exports.responseUsuarioSchemaProps);
exports.requestUsuarioSchema = exports.responseUsuarioSchema
    .omit({
    id: true,
    birthDate: true,
    createdAt: true,
    updatedAt: true
})
    .extend({
    password: v4_1.z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    birthDate: v4_1.z.coerce.string().nullish()
});
exports.editUsuarioSchema = exports.requestUsuarioSchema.partial();
// Schema específico para edição de usuário pelo admin (doctor)
// Inclui o campo cid que só pode ser alterado pelo administrador
exports.editUsuarioByAdminSchema = exports.editUsuarioSchema.extend({
    cid: v4_1.z
        .string()
        .optional()
        .describe("CID - Código Internacional de Doenças (apenas administradores)")
});
exports.responseUsuarioLoginSchema = v4_1.z.object({
    token: v4_1.z.string(),
    usuario: exports.responseUsuarioSchema
});
exports.responseDoctorSchema = v4_1.z.object({
    id: v4_1.z.string(),
    name: v4_1.z.string().nullish(),
    email: v4_1.z.string().transform((value) => value.toLowerCase()),
    image: v4_1.z.string().nullish(),
    phone: v4_1.z.string().nullish(),
    address: v4_1.z.string().nullish(),
    city: v4_1.z.string().nullish(),
    state: v4_1.z.string().nullish(),
    cid: v4_1.z.string().nullish(),
    register: schemaRegister,
    createdAt: v4_1.z.coerce.string().or(v4_1.z.date()).transform(formatDate_1.formatDate).nullish()
});
//# sourceMappingURL=usuario.js.map