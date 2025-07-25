import { z } from "zod/v4";
import { autenticarToken } from "@/middlewares/auth";
import { headersSchema } from "@/utils/scheme";
import {
  editUsuarioSchema,
  editUsuarioByAdminSchema,
  requestUsuarioSchema,
  responseDoctorSchema,
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

  static getDoctors = {
    schema: {
      tags: ["Usuario"],
      summary: "Listar todos os médicos",
      description: "Retorna todos os médicos cadastrados no sistema",
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseDoctorSchema)
        }),
        500: errorResponseSchema
      }
    }
  };

  static getAllUsuarios = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Listar todos os usuários",
      description:
        "Retorna todos os usuários cadastrados no sistema (apenas médicos podem acessar)",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseUsuarioSchema)
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getUsuarioById = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Buscar usuário por ID",
      description:
        "Retorna todas as informações de um usuário específico pelo ID. Apenas médicos podem acessar.",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do usuário")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioSchema
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static putUsuarioByDoctor = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Atualizar dados de usuário (médico)",
      description:
        "Permite que médicos atualizem os dados de qualquer usuário do sistema, incluindo o campo CID",
      headers: headersSchema,
      params: z.object({
        id: z.string().describe("ID do usuário a ser atualizado")
      }),
      body: editUsuarioByAdminSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
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
        password: z.string()
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: responseUsuarioLoginSchema
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static postUsuario = {
    schema: {
      tags: ["Usuario"],
      summary: "Criar um novo usuário",
      description: "Cria um novo usuário",
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
