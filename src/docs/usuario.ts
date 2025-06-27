import { z } from "zod/v3";
import { autenticarToken } from "@/middlewares/auth";
import { headersSchema } from "@/utils/scheme";
import {
  editUsuarioSchema,
  requestUsuarioSchema,
  responseUsuarioLoginSchema,
  responseUsuarioSchema
} from "@/types/usuario";

const errorResponseSchema = z.object({
  status: z.literal("error"),
  message: z.string()
});

export class usuarioDocs {
  static getUsuario = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Dados do usuário logado",
      description: "Retorna os dados do usuário logado",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioSchema
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static loginUsuario = {
    schema: {
      tags: ["Usuario"],
      summary: "Login do usuário",
      description: "Login do usuário",
      body: z.object({
        email: z.string().transform((value) => value.toLowerCase()),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioLoginSchema
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static postUsuario = {
    schema: {
      tags: ["Usuario"],
      summary: "Criar um novo usuário",
      description: "Cria um novo usuário não permitido criar um admin",
      body: requestUsuarioSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioLoginSchema
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static postUsuarioAdmin = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Criar um novo usuário pelo admin",
      description: "Cria um novo usuário com a role especificada",
      body: requestUsuarioSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioLoginSchema
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static putUsuario = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Atualizar os dados do usuário logado",
      description:
        "Atualiza os dados do usuário logado, os atributos são opcionais",
      headers: headersSchema,
      body: editUsuarioSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioSchema
        }),
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static deleteUsuario = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Deletar um usuário",
      description:
        "Deleta um usuário específico. Apenas admins podem deletar usuários.",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do usuário a ser deletado")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.object({
            message: z.string()
          })
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };
}
