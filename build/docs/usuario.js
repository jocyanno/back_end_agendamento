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
var import_v43 = require("zod/v4");

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
    const { userId, register } = request.user;
    request.usuario = {
      id: userId,
      register
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
var import_v4 = require("zod/v4");
var headersSchema = import_v4.z.object({
  authorization: import_v4.z.string()
});

// src/types/usuario.ts
var import_v42 = require("zod/v4");

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
var schemaRegister = import_v42.z.enum(["patient", "parents", "doctor", "attendant"]);
var responseUsuarioSchemaProps = {
  id: import_v42.z.string(),
  name: import_v42.z.string().nullish(),
  email: import_v42.z.string().transform((value) => value.toLowerCase()),
  image: import_v42.z.string().nullish(),
  birthDate: import_v42.z.coerce.string().or(import_v42.z.date()).transform(formatDate).nullish(),
  cpf: import_v42.z.string(),
  phone: import_v42.z.string().nullish(),
  address: import_v42.z.string().nullish(),
  numberOfAddress: import_v42.z.string().nullish(),
  complement: import_v42.z.string().nullish(),
  city: import_v42.z.string().nullish(),
  state: import_v42.z.string().nullish(),
  zipCode: import_v42.z.string().nullish(),
  country: import_v42.z.string().nullish(),
  cid: import_v42.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v42.z.coerce.string().or(import_v42.z.date()).transform(formatDate).nullish(),
  updatedAt: import_v42.z.coerce.string().or(import_v42.z.date()).transform(formatDate).nullish()
};
var responseUsuarioSchema = import_v42.z.object(responseUsuarioSchemaProps);
var requestUsuarioSchema = responseUsuarioSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: import_v42.z.string().describe("Senha obrigat\xF3ria para cria\xE7\xE3o do usu\xE1rio")
});
var editUsuarioSchema = requestUsuarioSchema.partial();
var editUsuarioByAdminSchema = editUsuarioSchema.extend({
  cid: import_v42.z.string().optional().describe("CID - C\xF3digo Internacional de Doen\xE7as (apenas administradores)")
});
var responseUsuarioLoginSchema = import_v42.z.object({
  token: import_v42.z.string(),
  usuario: responseUsuarioSchema
});
var responseDoctorSchema = import_v42.z.object({
  id: import_v42.z.string(),
  name: import_v42.z.string().nullish(),
  email: import_v42.z.string().transform((value) => value.toLowerCase()),
  image: import_v42.z.string().nullish(),
  phone: import_v42.z.string().nullish(),
  address: import_v42.z.string().nullish(),
  city: import_v42.z.string().nullish(),
  state: import_v42.z.string().nullish(),
  cid: import_v42.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v42.z.coerce.string().or(import_v42.z.date()).transform(formatDate).nullish()
});

// src/docs/usuario.ts
var errorResponseSchema = import_v43.z.object({
  status: import_v43.z.literal("error"),
  message: import_v43.z.string()
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
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
        data: responseUsuarioSchema
      }),
      400: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
usuarioDocs.getDoctors = {
  schema: {
    tags: ["Usuario"],
    summary: "Listar todos os m\xE9dicos",
    description: "Retorna todos os m\xE9dicos cadastrados no sistema",
    response: {
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
        data: import_v43.z.array(responseDoctorSchema)
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
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
        data: import_v43.z.array(responseUsuarioSchema)
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
    params: import_v43.z.object({
      id: import_v43.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
    params: import_v43.z.object({
      id: import_v43.z.string().describe("ID do usu\xE1rio a ser atualizado")
    }),
    body: editUsuarioByAdminSchema,
    response: {
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
    body: import_v43.z.object({
      email: import_v43.z.string().transform((value) => value.toLowerCase()),
      password: import_v43.z.string()
    }),
    response: {
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
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
    summary: "Deletar um usu\xE1rio",
    description: "Deleta um usu\xE1rio espec\xEDfico. Apenas admins podem deletar usu\xE1rios.",
    headers: headersSchema,
    params: import_v43.z.object({
      id: import_v43.z.string().describe("ID do usu\xE1rio a ser deletado")
    }),
    response: {
      200: import_v43.z.object({
        status: import_v43.z.literal("success"),
        data: import_v43.z.object({
          message: import_v43.z.string()
        })
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  usuarioDocs
});
