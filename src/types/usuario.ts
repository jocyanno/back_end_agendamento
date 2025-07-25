import { z } from "zod/v4";
import { formatDate } from "@/utils/formatDate";

const schemaRegister = z.enum(["patient", "parents", "doctor", "attendant"]);

export const responseUsuarioSchemaProps = {
  id: z.string(),
  name: z.string().nullish(),
  email: z.string().transform((value) => value.toLowerCase()),
  image: z.string().nullish(),
  birthDate: z.coerce.string().or(z.date()).transform(formatDate).nullish(),
  cpf: z.string(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  numberOfAddress: z.string().nullish(),
  complement: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  zipCode: z.string().nullish(),
  country: z.string().nullish(),
  cid: z.string().nullish(),
  register: schemaRegister,
  registeredBy: z.string().nullish(),
  createdAt: z.coerce.string().or(z.date()).transform(formatDate).nullish(),
  updatedAt: z.coerce.string().or(z.date()).transform(formatDate).nullish()
};

export const responseUsuarioSchema = z.object(responseUsuarioSchemaProps);

export const requestUsuarioSchema = responseUsuarioSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    password: z.string().describe("Senha obrigatória para criação do usuário")
  });

export const editUsuarioSchema = requestUsuarioSchema.partial();

// Schema específico para edição de usuário pelo admin (doctor)
// Inclui o campo cid que só pode ser alterado pelo administrador
export const editUsuarioByAdminSchema = editUsuarioSchema.extend({
  cid: z
    .string()
    .optional()
    .describe("CID - Código Internacional de Doenças (apenas administradores)")
});

export const responseUsuarioLoginSchema = z.object({
  token: z.string(),
  usuario: responseUsuarioSchema
});

export const responseDoctorSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  email: z.string().transform((value) => value.toLowerCase()),
  image: z.string().nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  cid: z.string().nullish(),
  register: schemaRegister,
  registeredBy: z.string().nullish(),
  createdAt: z.coerce.string().or(z.date()).transform(formatDate).nullish()
});
