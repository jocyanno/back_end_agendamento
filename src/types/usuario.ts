import { z } from "zod";
import { formatDate } from "@/utils/formatDate";

const schemaRegister = z.enum(["patient", "parents", "doctor"]);

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
  register: schemaRegister,
  createdAt: z.coerce.string().or(z.date()).transform(formatDate).nullish(),
  updatedAt: z.coerce.string().or(z.date()).transform(formatDate).nullish()
};

export const responseUsuarioSchema = z.object(responseUsuarioSchemaProps);

export const requestUsuarioSchema = responseUsuarioSchema
  .omit({
    id: true,
    birthDate: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    birthDate: z.coerce.string().nullish()
  });

export const editUsuarioSchema = requestUsuarioSchema.partial();

export const responseUsuarioLoginSchema = z.object({
  token: z.string(),
  usuario: responseUsuarioSchema
});
