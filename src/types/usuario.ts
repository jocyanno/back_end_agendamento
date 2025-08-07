import { z } from "zod";

const schemaRegister = z.enum([
  "patient",
  "parents",
  "professional",
  "attendant"
]);

const schemaUsuario = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioUpdate = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioCreate = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioCreateAdmin = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioUpdateAdmin = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioCreateByProfessional = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

const schemaUsuarioUpdateByProfessional = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  numberOfAddress: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  cid: z.string().optional(),
  image: z.string().optional()
});

// Schemas para documentação
const editUsuarioSchema = schemaUsuarioUpdate;
const editUsuarioByAdminSchema = schemaUsuarioUpdateByProfessional;
const requestUsuarioSchema = schemaUsuarioCreate;
const responseProfessionalSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  cpf: z.string(),
  phone: z.string().nullable(),
  birthDate: z.string().nullable(),
  address: z.string().nullable(),
  numberOfAddress: z.string().nullable(),
  complement: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  country: z.string().nullable(),
  cid: z.string().nullable(),
  image: z.string().nullable(),
  register: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});
const responseUsuarioLoginSchema = z.object({
  token: z.string(),
  usuario: responseProfessionalSchema
});
const responseUsuarioSchema = responseProfessionalSchema;

export {
  schemaUsuario,
  schemaUsuarioUpdate,
  schemaUsuarioCreate,
  schemaUsuarioCreateAdmin,
  schemaUsuarioUpdateAdmin,
  schemaUsuarioCreateByProfessional,
  schemaUsuarioUpdateByProfessional,
  editUsuarioSchema,
  editUsuarioByAdminSchema,
  requestUsuarioSchema,
  responseProfessionalSchema,
  responseUsuarioLoginSchema,
  responseUsuarioSchema
};
