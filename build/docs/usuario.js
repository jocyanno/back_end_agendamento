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

// src/docs/usuario.ts
var usuario_exports = {};
__export(usuario_exports, {
  usuarioDocs: () => usuarioDocs
});
module.exports = __toCommonJS(usuario_exports);
var import_zod3 = require("zod");

// src/_errors/unauthorized.ts
var Unauthorized = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthorized";
  }
};

// src/middlewares/auth.ts
async function autenticarToken(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Unauthorized("Token de autentica\xE7\xE3o n\xE3o fornecido");
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new Unauthorized("Formato de token inv\xE1lido. Use: Bearer <token>");
    }
    await request.jwtVerify();
    const { userId, primaryRole, primaryOrganizationId, userOrganizations } = request.user;
    request.usuario = {
      id: userId,
      primaryRole,
      primaryOrganizationId,
      userOrganizations
    };
  } catch (error) {
    if (error instanceof Unauthorized) {
      throw error;
    }
    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      throw new Unauthorized("Token de autentica\xE7\xE3o inv\xE1lido");
    }
    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
      throw new Unauthorized("Token de autentica\xE7\xE3o expirado");
    }
    throw new Unauthorized("Falha na autentica\xE7\xE3o");
  }
}

// src/utils/scheme.ts
var import_zod = require("zod");
var headersSchema = import_zod.z.object({
  authorization: import_zod.z.string()
});

// src/types/usuario.ts
var import_zod2 = require("zod");
var schemaRegister = import_zod2.z.enum([
  "patient",
  "parents",
  "professional",
  "attendant"
]);
var schemaUsuario = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod2.z.string().email("Email inv\xE1lido"),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaUsuarioUpdate = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod2.z.string().email("Email inv\xE1lido").optional(),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaPatientCID = import_zod2.z.object({
  patientId: import_zod2.z.string().min(1, "ID do paciente \xE9 obrigat\xF3rio"),
  professionalId: import_zod2.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  organizationId: import_zod2.z.string().min(1, "ID da organiza\xE7\xE3o \xE9 obrigat\xF3rio"),
  cid: import_zod2.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod2.z.string().optional()
});
var schemaPatientCIDUpdate = import_zod2.z.object({
  cid: import_zod2.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod2.z.string().optional()
});
var schemaUsuarioCreate = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod2.z.string().email("Email inv\xE1lido"),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaUsuarioCreateAdmin = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod2.z.string().email("Email inv\xE1lido"),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaUsuarioUpdateAdmin = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod2.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaUsuarioCreateByProfessional = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod2.z.string().email("Email inv\xE1lido"),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var schemaUsuarioUpdateByProfessional = import_zod2.z.object({
  name: import_zod2.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod2.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod2.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod2.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod2.z.string().optional(),
  birthDate: import_zod2.z.string().optional(),
  address: import_zod2.z.string().optional(),
  numberOfAddress: import_zod2.z.string().optional(),
  complement: import_zod2.z.string().optional(),
  city: import_zod2.z.string().optional(),
  state: import_zod2.z.string().optional(),
  zipCode: import_zod2.z.string().optional(),
  country: import_zod2.z.string().optional(),
  image: import_zod2.z.string().optional()
});
var editUsuarioSchema = schemaUsuarioUpdate;
var editUsuarioByAdminSchema = schemaUsuarioUpdateByProfessional;
var requestUsuarioSchema = schemaUsuarioCreate;
var responseProfessionalSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  name: import_zod2.z.string(),
  email: import_zod2.z.string(),
  cpf: import_zod2.z.string(),
  phone: import_zod2.z.string().nullable(),
  birthDate: import_zod2.z.string().nullable(),
  address: import_zod2.z.string().nullable(),
  numberOfAddress: import_zod2.z.string().nullable(),
  complement: import_zod2.z.string().nullable(),
  city: import_zod2.z.string().nullable(),
  state: import_zod2.z.string().nullable(),
  zipCode: import_zod2.z.string().nullable(),
  country: import_zod2.z.string().nullable(),
  image: import_zod2.z.string().nullable(),
  primaryRole: import_zod2.z.string(),
  primaryOrganizationId: import_zod2.z.string().nullable(),
  organizations: import_zod2.z.array(
    import_zod2.z.object({
      id: import_zod2.z.string(),
      name: import_zod2.z.string(),
      role: import_zod2.z.string()
    })
  ),
  createdAt: import_zod2.z.string(),
  updatedAt: import_zod2.z.string()
});
var responseUsuarioLoginSchema = import_zod2.z.object({
  token: import_zod2.z.string(),
  usuario: responseProfessionalSchema
});
var responseUsuarioSchema = responseProfessionalSchema;

// src/docs/usuario.ts
var errorResponseSchema = import_zod3.z.object({
  status: import_zod3.z.literal("error"),
  message: import_zod3.z.string()
});
var usuarioDocs = class {
};
usuarioDocs.getUsuario = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Dados do usu\xE1rio logado",
    description: "Retorna os dados do usu\xE1rio logado",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioSchema
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.getProfessionals = {
  schema: {
    tags: ["Usuario"],
    summary: "Listar todos os profissionais",
    description: "Retorna todos os profissionais cadastrados no sistema",
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseProfessionalSchema)
      }),
      500: errorResponseSchema
    }
  }
};
usuarioDocs.getAllUsuarios = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Listar todos os usu\xE1rios",
    description: "Retorna todos os usu\xE1rios cadastrados no sistema (apenas m\xE9dicos podem acessar)",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(responseUsuarioSchema)
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.getUsuarioById = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Buscar usu\xE1rio por ID",
    description: "Retorna todas as informa\xE7\xF5es de um usu\xE1rio espec\xEDfico pelo ID. Apenas m\xE9dicos podem acessar.",
    headers: headersSchema,
    params: import_zod3.z.object({
      id: import_zod3.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioSchema
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.putUsuarioByDoctor = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Atualizar dados de usu\xE1rio (m\xE9dico)",
    description: "Permite que m\xE9dicos atualizem os dados de qualquer usu\xE1rio do sistema, incluindo o campo CID",
    headers: headersSchema,
    params: import_zod3.z.object({
      id: import_zod3.z.string().describe("ID do usu\xE1rio a ser atualizado")
    }),
    body: editUsuarioByAdminSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
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
usuarioDocs.loginUsuario = {
  schema: {
    tags: ["Usuario"],
    summary: "Login do usu\xE1rio",
    description: "Login do usu\xE1rio",
    body: import_zod3.z.object({
      email: import_zod3.z.string().transform((value) => value.toLowerCase()),
      password: import_zod3.z.string()
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioLoginSchema
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.postUsuario = {
  schema: {
    tags: ["Usuario"],
    summary: "Criar um novo usu\xE1rio",
    description: "Cria um novo usu\xE1rio",
    body: requestUsuarioSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioLoginSchema
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.postUsuarioAdmin = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Criar um novo usu\xE1rio pelo admin",
    description: "Cria um novo usu\xE1rio com a role especificada",
    body: requestUsuarioSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioLoginSchema
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.putUsuario = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Atualizar os dados do usu\xE1rio logado",
    description: "Atualiza os dados do usu\xE1rio logado, os atributos s\xE3o opcionais",
    headers: headersSchema,
    body: editUsuarioSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: responseUsuarioSchema
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.deleteUsuario = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Deletar usu\xE1rio",
    description: "Deleta um usu\xE1rio do sistema. Apenas administradores podem acessar.",
    headers: headersSchema,
    params: import_zod3.z.object({
      id: import_zod3.z.string().describe("ID do usu\xE1rio a ser deletado")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.object({
          message: import_zod3.z.string()
        })
      }),
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.addUserToOrganization = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Adicionar usu\xE1rio a organiza\xE7\xE3o",
    description: "Adiciona um usu\xE1rio existente a uma organiza\xE7\xE3o com um papel espec\xEDfico. Apenas administradores podem acessar.",
    headers: headersSchema,
    body: import_zod3.z.object({
      userId: import_zod3.z.string().describe("ID do usu\xE1rio"),
      organizationId: import_zod3.z.string().describe("ID da organiza\xE7\xE3o"),
      role: import_zod3.z.enum([
        "owner",
        "admin",
        "professional",
        "attendant",
        "patient",
        "member"
      ]).describe("Papel do usu\xE1rio na organiza\xE7\xE3o")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.object({
          id: import_zod3.z.string(),
          userId: import_zod3.z.string(),
          organizationId: import_zod3.z.string(),
          role: import_zod3.z.string(),
          isActive: import_zod3.z.boolean(),
          joinedAt: import_zod3.z.string(),
          createdAt: import_zod3.z.string(),
          updatedAt: import_zod3.z.string(),
          organization: import_zod3.z.object({
            id: import_zod3.z.string(),
            name: import_zod3.z.string()
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
usuarioDocs.getUserOrganizations = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Buscar organiza\xE7\xF5es de usu\xE1rio",
    description: "Busca todas as organiza\xE7\xF5es de um usu\xE1rio espec\xEDfico. Apenas administradores podem acessar.",
    headers: headersSchema,
    params: import_zod3.z.object({
      userId: import_zod3.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            id: import_zod3.z.string(),
            userId: import_zod3.z.string(),
            organizationId: import_zod3.z.string(),
            role: import_zod3.z.string(),
            isActive: import_zod3.z.boolean(),
            joinedAt: import_zod3.z.string(),
            createdAt: import_zod3.z.string(),
            updatedAt: import_zod3.z.string(),
            organization: import_zod3.z.object({
              id: import_zod3.z.string(),
              name: import_zod3.z.string(),
              description: import_zod3.z.string().nullable()
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
usuarioDocs.getUsersFromCurrentOrganization = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Buscar usu\xE1rios da organiza\xE7\xE3o atual",
    description: "Busca todos os usu\xE1rios da organiza\xE7\xE3o atual do usu\xE1rio logado. Apenas administradores podem acessar.",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            id: import_zod3.z.string(),
            name: import_zod3.z.string().nullable(),
            email: import_zod3.z.string(),
            cpf: import_zod3.z.string(),
            phone: import_zod3.z.string().nullable(),
            birthDate: import_zod3.z.string().nullable(),
            address: import_zod3.z.string().nullable(),
            numberOfAddress: import_zod3.z.string().nullable(),
            complement: import_zod3.z.string().nullable(),
            city: import_zod3.z.string().nullable(),
            state: import_zod3.z.string().nullable(),
            zipCode: import_zod3.z.string().nullable(),
            country: import_zod3.z.string().nullable(),
            createdAt: import_zod3.z.string(),
            updatedAt: import_zod3.z.string(),
            primaryRole: import_zod3.z.string().nullable(),
            primaryOrganizationId: import_zod3.z.string().nullable(),
            organizations: import_zod3.z.array(
              import_zod3.z.object({
                id: import_zod3.z.string(),
                role: import_zod3.z.string(),
                joinedAt: import_zod3.z.string(),
                isActive: import_zod3.z.boolean()
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
usuarioDocs.removeUserFromOrganization = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Remover usu\xE1rio da organiza\xE7\xE3o",
    description: "Remove um usu\xE1rio da organiza\xE7\xE3o atual do usu\xE1rio logado. Apenas administradores podem acessar.",
    headers: headersSchema,
    params: import_zod3.z.object({
      userId: import_zod3.z.string().describe("ID do usu\xE1rio a ser removido")
    }),
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.object({
          id: import_zod3.z.string(),
          userId: import_zod3.z.string(),
          organizationId: import_zod3.z.string(),
          role: import_zod3.z.string(),
          isActive: import_zod3.z.boolean(),
          joinedAt: import_zod3.z.string(),
          createdAt: import_zod3.z.string(),
          updatedAt: import_zod3.z.string(),
          organization: import_zod3.z.object({
            id: import_zod3.z.string(),
            name: import_zod3.z.string()
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
usuarioDocs.getAllUsersFromSystem = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Usuario"],
    summary: "Buscar todos os usu\xE1rios do sistema",
    description: "Busca todos os usu\xE1rios do sistema. Apenas propriet\xE1rios, administradores e membros podem acessar.",
    headers: headersSchema,
    response: {
      200: import_zod3.z.object({
        status: import_zod3.z.literal("success"),
        data: import_zod3.z.array(
          import_zod3.z.object({
            id: import_zod3.z.string(),
            name: import_zod3.z.string().nullable(),
            email: import_zod3.z.string(),
            cpf: import_zod3.z.string(),
            phone: import_zod3.z.string().nullable(),
            birthDate: import_zod3.z.string().nullable(),
            address: import_zod3.z.string().nullable(),
            numberOfAddress: import_zod3.z.string().nullable(),
            complement: import_zod3.z.string().nullable(),
            city: import_zod3.z.string().nullable(),
            state: import_zod3.z.string().nullable(),
            zipCode: import_zod3.z.string().nullable(),
            country: import_zod3.z.string().nullable(),
            createdAt: import_zod3.z.string(),
            updatedAt: import_zod3.z.string(),
            primaryRole: import_zod3.z.string().nullable(),
            primaryOrganizationId: import_zod3.z.string().nullable(),
            organizations: import_zod3.z.array(
              import_zod3.z.object({
                id: import_zod3.z.string(),
                name: import_zod3.z.string(),
                role: import_zod3.z.string(),
                joinedAt: import_zod3.z.string()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  usuarioDocs
});
