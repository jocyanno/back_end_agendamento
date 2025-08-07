import { z } from "zod";
import { autenticarToken } from "@/middlewares/auth";
import { headersSchema } from "@/utils/scheme";
import {
  editUsuarioSchema,
  editUsuarioByAdminSchema,
  requestUsuarioSchema,
  responseProfessionalSchema,
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

  static getProfessionals = {
    schema: {
      tags: ["Usuario"],
      summary: "Listar todos os profissionais",
      description: "Retorna todos os profissionais cadastrados no sistema",
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(responseProfessionalSchema)
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
      summary: "Deletar usuário",
      description:
        "Deleta um usuário do sistema. Apenas administradores podem acessar.",
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
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static addUserToOrganization = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Adicionar usuário a organização",
      description:
        "Adiciona um usuário existente a uma organização com um papel específico. Apenas administradores podem acessar.",
      headers: headersSchema,
      body: z.object({
        userId: z.string().describe("ID do usuário"),
        organizationId: z.string().describe("ID da organização"),
        role: z
          .enum([
            "owner",
            "admin",
            "professional",
            "attendant",
            "patient",
            "member"
          ])
          .describe("Papel do usuário na organização")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.object({
            id: z.string(),
            userId: z.string(),
            organizationId: z.string(),
            role: z.string(),
            isActive: z.boolean(),
            joinedAt: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
            organization: z.object({
              id: z.string(),
              name: z.string()
            })
          })
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getUserOrganizations = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Buscar organizações de usuário",
      description:
        "Busca todas as organizações de um usuário específico. Apenas administradores podem acessar.",
      headers: headersSchema,
      params: z.object({
        userId: z.string().describe("ID do usuário")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(
            z.object({
              id: z.string(),
              userId: z.string(),
              organizationId: z.string(),
              role: z.string(),
              isActive: z.boolean(),
              joinedAt: z.string(),
              createdAt: z.string(),
              updatedAt: z.string(),
              organization: z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().nullable()
              })
            })
          )
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getUsersFromCurrentOrganization = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Buscar usuários da organização atual",
      description:
        "Busca todos os usuários da organização atual do usuário logado. Apenas administradores podem acessar.",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
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
              createdAt: z.string(),
              updatedAt: z.string(),
              primaryRole: z.string().nullable(),
              primaryOrganizationId: z.string().nullable(),
              organizations: z.array(
                z.object({
                  id: z.string(),
                  role: z.string(),
                  joinedAt: z.string(),
                  isActive: z.boolean()
                })
              )
            })
          )
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static removeUserFromOrganization = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Remover usuário da organização",
      description:
        "Remove um usuário da organização atual do usuário logado. Apenas administradores podem acessar.",
      headers: headersSchema,
      params: z.object({
        userId: z.string().describe("ID do usuário a ser removido")
      }),
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.object({
            id: z.string(),
            userId: z.string(),
            organizationId: z.string(),
            role: z.string(),
            isActive: z.boolean(),
            joinedAt: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
            organization: z.object({
              id: z.string(),
              name: z.string()
            })
          })
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };

  static getAllUsersFromSystem = {
    preHandler: [autenticarToken],
    schema: {
      tags: ["Usuario"],
      summary: "Buscar todos os usuários do sistema",
      description:
        "Busca todos os usuários do sistema. Apenas proprietários, administradores e membros podem acessar.",
      headers: headersSchema,
      response: {
        200: z.object({
          status: z.literal("success"),
          data: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
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
              createdAt: z.string(),
              updatedAt: z.string(),
              primaryRole: z.string().nullable(),
              primaryOrganizationId: z.string().nullable(),
              organizations: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  role: z.string(),
                  joinedAt: z.string()
                })
              )
            })
          )
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  };
}
