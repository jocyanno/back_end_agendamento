"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_fastify = __toESM(require("fastify"));
var import_fastify_type_provider_zod = require("fastify-type-provider-zod");
var import_swagger = __toESM(require("@fastify/swagger"));
var import_swagger_ui = __toESM(require("@fastify/swagger-ui"));
var import_cors = __toESM(require("@fastify/cors"));
var import_jwt = __toESM(require("@fastify/jwt"));

// src/error-handler.ts
var import_v4 = require("zod/v4");

// src/_errors/bad-request.ts
var BadRequest = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest";
  }
};

// src/_errors/not-found.ts
var NotFound = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFound";
  }
};

// src/_errors/unauthorized.ts
var Unauthorized = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthorized";
  }
};

// src/error-handler.ts
function errorHandler(error, request, reply) {
  if (error instanceof import_v4.ZodError) {
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      issues: error.flatten().fieldErrors
    });
  }
  if (error.code === "FST_ERR_CTP_EMPTY_JSON_BODY") {
    return reply.status(400).send({
      status: "error",
      message: "Requisi\xE7\xE3o inv\xE1lida: n\xE3o envie body em requisi\xE7\xF5es GET ou DELETE"
    });
  }
  if (error.code === "FST_ERR_VALIDATION") {
    if (error.validationContext === "headers" && String(error.message).toLowerCase().includes("authorization")) {
      return reply.status(401).send({
        status: "error",
        message: "Token inv\xE1lido ou n\xE3o fornecido"
      });
    }
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      details: error.message
    });
  }
  if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
    return reply.status(401).send({
      status: "error",
      message: "Token inv\xE1lido ou n\xE3o fornecido"
    });
  }
  if (error.code === "FST_JWT_BAD_REQUEST") {
    return reply.status(401).send({
      status: "error",
      message: "Token inv\xE1lido"
    });
  }
  if (error instanceof BadRequest) {
    return reply.status(400).send({
      status: "error",
      message: error.message
    });
  }
  if (error instanceof NotFound) {
    return reply.status(404).send({
      status: "error",
      message: error.message
    });
  }
  if (error instanceof Unauthorized) {
    return reply.status(401).send({
      status: "error",
      message: error.message
    });
  }
  console.error("Internal server error:", error);
  return reply.status(500).send({
    status: "error",
    message: "Internal server error"
  });
}

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/service/usuarioService.service.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_moment_timezone = __toESM(require("moment-timezone"));
var selectUsuario = {
  id: true,
  name: true,
  email: true,
  image: true,
  birthDate: true,
  cpf: true,
  phone: true,
  address: true,
  numberOfAddress: true,
  complement: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  cid: true,
  register: true,
  createdAt: true,
  updatedAt: true
};
async function authenticateUser(email, password, fastify2) {
  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      password: true,
      ...selectUsuario
    }
  });
  if (!user || !await import_bcrypt.default.compare(password, user.password)) {
    throw new Unauthorized("Invalid credentials");
  }
  const { password: _, ...userWithoutPassword } = user;
  const token = await fastify2.jwt.sign(
    { userId: user.id, register: user.register },
    { expiresIn: "7d" }
  );
  return {
    token,
    usuario: userWithoutPassword
  };
}
async function searchUsuario(usuarioId) {
  const searchUserExisting = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });
  if (!searchUserExisting) {
    throw new NotFound("User not found");
  }
  return searchUserExisting;
}
var getUsuarioLogado = async (request) => {
  const usuarioId = request.usuario.id;
  return searchUsuario(usuarioId);
};
var getUsuarioLogadoIsAdmin = async (request) => {
  const { id: usuarioId, register } = request.usuario;
  if (register !== "doctor") {
    throw new Unauthorized("User is not doctor");
  }
  return searchUsuario(usuarioId);
};
var getUsuarioLogadoIsAdminOrAttendant = async (request) => {
  const { id: usuarioId, register } = request.usuario;
  if (register !== "doctor" && register !== "attendant") {
    throw new Unauthorized("User is not doctor");
  }
  return searchUsuario(usuarioId);
};
async function getUserById(usuarioId) {
  const user = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  return user;
}
async function getUserExisting({
  email,
  cpf
}) {
  let user = null;
  if (email) {
    user = await prisma.users.findUnique({
      where: {
        email
      },
      select: selectUsuario
    });
    if (user) {
      throw new BadRequest("User already exists");
    }
  }
  if (cpf) {
    user = await prisma.users.findUnique({
      where: {
        cpf
      },
      select: selectUsuario
    });
    if (user) {
      throw new BadRequest("User already exists");
    }
  }
  return;
}
async function createUser(data) {
  if (data.register === "doctor") {
    throw new BadRequest("Register doctor is not allowed");
  }
  if (!data.password) {
    throw new BadRequest("Password is required");
  }
  const hashedPassword = await import_bcrypt.default.hash(data.password, 10);
  const user = await prisma.users.create({
    data: {
      ...data,
      birthDate: data.birthDate ? (0, import_moment_timezone.default)(data.birthDate).isValid() ? (0, import_moment_timezone.default)(data.birthDate).toDate() : null : null,
      password: hashedPassword
    },
    select: selectUsuario
  });
  return user;
}
async function createUserAdmin(data) {
  if (!data.password) {
    throw new BadRequest("Password is required");
  }
  const hashedPassword = await import_bcrypt.default.hash(data.password, 10);
  const user = await prisma.users.create({
    data: {
      ...data,
      birthDate: data.birthDate ? (0, import_moment_timezone.default)(data.birthDate).isValid() ? (0, import_moment_timezone.default)(data.birthDate).toDate() : null : null,
      password: hashedPassword
    },
    select: selectUsuario
  });
  return user;
}
async function updateUser(usuarioId, data) {
  const { cid, ...allowedData } = data;
  const searchUser = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });
  if (!searchUser) {
    throw new NotFound("User not found");
  }
  if (allowedData.email && allowedData.email !== searchUser.email) {
    if (typeof allowedData.email === "string") {
      const existingUser = await prisma.users.findUnique({
        where: { email: allowedData.email },
        select: { id: true }
      });
      if (existingUser && existingUser.id !== usuarioId) {
        throw new BadRequest("User already exists");
      }
    }
  }
  if (allowedData.cpf && allowedData.cpf !== searchUser.cpf) {
    if (typeof allowedData.cpf === "string") {
      const existingUser = await prisma.users.findUnique({
        where: { cpf: allowedData.cpf },
        select: { id: true }
      });
      if (existingUser && existingUser.id !== usuarioId) {
        throw new BadRequest("User already exists");
      }
    }
  }
  if (allowedData.password) {
    allowedData.password = await import_bcrypt.default.hash(
      allowedData.password,
      10
    );
  }
  if (allowedData.birthDate && typeof allowedData.birthDate === "string") {
    allowedData.birthDate = new Date(allowedData.birthDate);
  }
  const dadosLimpos = Object.fromEntries(
    Object.entries(allowedData).filter(([_, value]) => value !== null)
  );
  try {
    const usuarioAtualizado = await prisma.users.update({
      where: { id: usuarioId },
      data: {
        ...dadosLimpos
      },
      select: selectUsuario
    });
    return usuarioAtualizado;
  } catch (err) {
    if (err.code === "P2002") {
      throw new BadRequest("User already exists");
    }
    throw err;
  }
}
async function getAllUsers() {
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { register: "patient" },
        { register: "parents" }
      ]
    },
    select: selectUsuario,
    orderBy: [
      { name: "asc" }
    ]
  });
  return users;
}
async function getAllDoctors() {
  const doctors = await prisma.users.findMany({
    where: {
      register: "doctor"
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      cid: true,
      register: true,
      createdAt: true
    },
    orderBy: {
      name: "asc"
    }
  });
  return doctors;
}
async function updateUserByDoctor(targetUserId, data) {
  const searchUser = await prisma.users.findUnique({
    where: {
      id: targetUserId
    },
    select: selectUsuario
  });
  if (!searchUser) {
    throw new NotFound("User not found");
  }
  if (data.email && data.email !== searchUser.email) {
    if (typeof data.email === "string") {
      const existingUser = await prisma.users.findUnique({
        where: { email: data.email },
        select: { id: true }
      });
      if (existingUser && existingUser.id !== targetUserId) {
        throw new BadRequest("User already exists");
      }
    }
  }
  if (data.cpf && data.cpf !== searchUser.cpf) {
    if (typeof data.cpf === "string") {
      const existingUser = await prisma.users.findUnique({
        where: { cpf: data.cpf },
        select: { id: true }
      });
      if (existingUser && existingUser.id !== targetUserId) {
        throw new BadRequest("User already exists");
      }
    }
  }
  if (data.password) {
    data.password = await import_bcrypt.default.hash(data.password, 10);
  }
  if (data.birthDate && typeof data.birthDate === "string") {
    data.birthDate = new Date(data.birthDate);
  }
  const dadosLimpos = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== null)
  );
  try {
    const usuarioAtualizado = await prisma.users.update({
      where: { id: targetUserId },
      data: {
        ...dadosLimpos
      },
      select: selectUsuario
    });
    return usuarioAtualizado;
  } catch (err) {
    if (err.code === "P2002") {
      throw new BadRequest("User already exists");
    }
    throw err;
  }
}
async function deleteUser(usuarioId, adminId) {
  const searchUser = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });
  if (!searchUser) {
    throw new NotFound("User not found");
  }
  if (usuarioId === adminId) {
    throw new BadRequest("Admin cannot delete themselves");
  }
  await prisma.users.delete({
    where: {
      id: usuarioId
    }
  });
  return { message: "User deleted successfully" };
}

// src/controllers/usuarioController.ts
async function getUsuario(request, reply) {
  const usuario = await getUsuarioLogado(request);
  return reply.status(200).send({
    status: "success",
    data: usuario
  });
}
async function loginUsuario(request, reply) {
  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);
    const { email, password } = request.body;
    console.log("Email:", email);
    console.log("Password length:", password?.length);
    if (!email || !password) {
      console.log("Missing email or password");
      return reply.status(400).send({
        status: "error",
        message: "Email e senha s\xE3o obrigat\xF3rios"
      });
    }
    const user = await authenticateUser(email, password, request.server);
    console.log("Login successful for:", email);
    return reply.status(200).send({
      status: "success",
      data: { token: user.token, usuario: user.usuario }
    });
  } catch (error) {
    console.error("Login error:", error);
    return reply.status(401).send({
      status: "error",
      message: error instanceof Error ? error.message : "Credenciais inv\xE1lidas"
    });
  }
}
async function createUsuario(request, reply) {
  try {
    console.log("=== CREATE USER ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);
    const parseResult = request.body;
    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });
    const createUsuario2 = await createUser(parseResult);
    const token = request.server.jwt.sign(
      { userId: createUsuario2.id, register: createUsuario2.register },
      { expiresIn: "7d" }
    );
    console.log("Usu\xE1rio criado com sucesso:", createUsuario2.email);
    return reply.status(200).send({
      status: "success",
      data: { token, usuario: createUsuario2 }
    });
  } catch (error) {
    console.error("Erro na cria\xE7\xE3o de usu\xE1rio:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Validation error"
    });
  }
}
async function createUsuarioAdmin(request, reply) {
  const admin = await getUsuarioLogadoIsAdmin(request);
  const parseResult = request.body;
  console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
  await getUserExisting({
    email: parseResult.email,
    cpf: parseResult.cpf
  });
  const createUsuario2 = await createUserAdmin(parseResult);
  const token = request.server.jwt.sign(
    { userId: createUsuario2.id, register: createUsuario2.register },
    { expiresIn: "7d" }
  );
  return reply.status(200).send({
    status: "success",
    data: { token, usuario: createUsuario2 }
  });
}
async function updateUsuario(request, reply) {
  const usuario = await getUsuarioLogado(request);
  const parseResult = request.body;
  const updateUsuario2 = await updateUser(usuario.id, parseResult);
  return reply.code(200).send({
    status: "success",
    data: updateUsuario2
  });
}
async function getDoctors(request, reply) {
  const doctors = await getAllDoctors();
  return reply.status(200).send({
    status: "success",
    data: doctors
  });
}
async function getAllUsuarios(request, reply) {
  await getUsuarioLogadoIsAdminOrAttendant(request);
  const users = await getAllUsers();
  return reply.status(200).send({
    status: "success",
    data: users
  });
}
async function getUsuarioById(request, reply) {
  await getUsuarioLogadoIsAdmin(request);
  const { id } = request.params;
  const user = await getUserById(id);
  return reply.status(200).send({
    status: "success",
    data: user
  });
}
async function updateUsuarioByDoctor(request, reply) {
  await getUsuarioLogadoIsAdmin(request);
  const { id } = request.params;
  const parseResult = request.body;
  const updateUsuario2 = await updateUserByDoctor(id, parseResult);
  return reply.status(200).send({
    status: "success",
    data: updateUsuario2
  });
}
async function deleteUsuario(request, reply) {
  const admin = await getUsuarioLogadoIsAdmin(request);
  const { id } = request.params;
  const result = await deleteUser(id, admin.id);
  return reply.code(200).send({
    status: "success",
    data: result
  });
}

// src/docs/usuario.ts
var import_v44 = require("zod/v4");

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
var import_v42 = require("zod/v4");
var headersSchema = import_v42.z.object({
  authorization: import_v42.z.string()
});

// src/types/usuario.ts
var import_v43 = require("zod/v4");

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
var schemaRegister = import_v43.z.enum(["patient", "parents", "doctor", "attendant"]);
var responseUsuarioSchemaProps = {
  id: import_v43.z.string(),
  name: import_v43.z.string().nullish(),
  email: import_v43.z.string().transform((value) => value.toLowerCase()),
  image: import_v43.z.string().nullish(),
  birthDate: import_v43.z.coerce.string().or(import_v43.z.date()).transform(formatDate).nullish(),
  cpf: import_v43.z.string(),
  phone: import_v43.z.string().nullish(),
  address: import_v43.z.string().nullish(),
  numberOfAddress: import_v43.z.string().nullish(),
  complement: import_v43.z.string().nullish(),
  city: import_v43.z.string().nullish(),
  state: import_v43.z.string().nullish(),
  zipCode: import_v43.z.string().nullish(),
  country: import_v43.z.string().nullish(),
  cid: import_v43.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v43.z.coerce.string().or(import_v43.z.date()).transform(formatDate).nullish(),
  updatedAt: import_v43.z.coerce.string().or(import_v43.z.date()).transform(formatDate).nullish()
};
var responseUsuarioSchema = import_v43.z.object(responseUsuarioSchemaProps);
var requestUsuarioSchema = responseUsuarioSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: import_v43.z.string().describe("Senha obrigat\xF3ria para cria\xE7\xE3o do usu\xE1rio")
});
var editUsuarioSchema = requestUsuarioSchema.partial();
var editUsuarioByAdminSchema = editUsuarioSchema.extend({
  cid: import_v43.z.string().optional().describe("CID - C\xF3digo Internacional de Doen\xE7as (apenas administradores)")
});
var responseUsuarioLoginSchema = import_v43.z.object({
  token: import_v43.z.string(),
  usuario: responseUsuarioSchema
});
var responseDoctorSchema = import_v43.z.object({
  id: import_v43.z.string(),
  name: import_v43.z.string().nullish(),
  email: import_v43.z.string().transform((value) => value.toLowerCase()),
  image: import_v43.z.string().nullish(),
  phone: import_v43.z.string().nullish(),
  address: import_v43.z.string().nullish(),
  city: import_v43.z.string().nullish(),
  state: import_v43.z.string().nullish(),
  cid: import_v43.z.string().nullish(),
  register: schemaRegister,
  createdAt: import_v43.z.coerce.string().or(import_v43.z.date()).transform(formatDate).nullish()
});

// src/docs/usuario.ts
var errorResponseSchema = import_v44.z.object({
  status: import_v44.z.literal("error"),
  message: import_v44.z.string()
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
        data: import_v44.z.array(responseDoctorSchema)
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
        data: import_v44.z.array(responseUsuarioSchema)
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
    params: import_v44.z.object({
      id: import_v44.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
    params: import_v44.z.object({
      id: import_v44.z.string().describe("ID do usu\xE1rio a ser atualizado")
    }),
    body: editUsuarioByAdminSchema,
    response: {
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
    body: import_v44.z.object({
      email: import_v44.z.string().transform((value) => value.toLowerCase()),
      password: import_v44.z.string()
    }),
    response: {
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
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
    params: import_v44.z.object({
      id: import_v44.z.string().describe("ID do usu\xE1rio a ser deletado")
    }),
    response: {
      200: import_v44.z.object({
        status: import_v44.z.literal("success"),
        data: import_v44.z.object({
          message: import_v44.z.string()
        })
      }),
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema
    }
  }
};

// src/routes/user/usuarioRoutes.ts
async function usuarioRoutes(app2) {
  app2.withTypeProvider().get("/user", usuarioDocs.getUsuario, getUsuario);
  app2.withTypeProvider().get("/doctors", usuarioDocs.getDoctors, getDoctors);
  app2.withTypeProvider().get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);
  app2.withTypeProvider().get("/users/:id", usuarioDocs.getUsuarioById, getUsuarioById);
  app2.withTypeProvider().post("/user/login", usuarioDocs.loginUsuario, loginUsuario);
  app2.withTypeProvider().post("/user", usuarioDocs.postUsuario, createUsuario);
  app2.withTypeProvider().post("/user/admin", usuarioDocs.postUsuarioAdmin, createUsuarioAdmin);
  app2.withTypeProvider().put("/user", usuarioDocs.putUsuario, updateUsuario);
  app2.withTypeProvider().put("/user/:id", usuarioDocs.putUsuarioByDoctor, updateUsuarioByDoctor);
  app2.withTypeProvider().delete("/user/:id", usuarioDocs.deleteUsuario, deleteUsuario);
}

// src/service/appointmentService.service.ts
var import_moment_timezone3 = __toESM(require("moment-timezone"));

// src/service/notificationService.service.ts
var import_moment_timezone2 = __toESM(require("moment-timezone"));
var TIMEZONE = "America/Sao_Paulo";
function getAppointmentConfirmationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Confirma\xE7\xE3o de Agendamento</h2>
      <p>Ol\xE1 ${data.patientName},</p>
      <p>Seu agendamento foi confirmado com sucesso!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Hor\xE1rio:</strong> ${data.time}</p>
        ${data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ""}
      </div>
      
      <p><strong>Importante:</strong> Caso precise cancelar, fa\xE7a isso com pelo menos 24 horas de anteced\xEAncia.</p>
      <p><strong>Lembrete:</strong> O evento foi adicionado ao seu calend\xE1rio Google.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}
function getAppointmentCancellationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Agendamento Cancelado</h2>
      <p>Ol\xE1 ${data.patientName},</p>
      <p>Informamos que seu agendamento foi cancelado.</p>
      
      <div style="background-color: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento Cancelado:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Hor\xE1rio:</strong> ${data.time}</p>
        ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}
      </div>
      
      <p>Se desejar, voc\xEA pode agendar um novo hor\xE1rio atrav\xE9s do nosso sistema.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}
async function createNotification(data) {
  return await prisma.notification.create({
    data
  });
}
async function sendAppointmentConfirmation(appointment) {
  const date = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "confirmation",
    title: "Agendamento Confirmado",
    message: `Seu agendamento com ${appointment.doctor.name} foi confirmado para ${date} \xE0s ${time}`
  });
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
    date,
    time
  });
}
async function sendAppointmentCancellation(appointment, reason) {
  const date = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "cancellation",
    title: "Agendamento Cancelado",
    message: `Seu agendamento com ${appointment.doctor.name} para ${date} \xE0s ${time} foi cancelado`
  });
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
    date,
    time,
    reason
  });
}

// src/service/appointmentService.service.ts
var TIMEZONE2 = "America/Sao_Paulo";
var SESSION_DURATION_MINUTES = 50;
var BREAK_DURATION_MINUTES = 10;
var END_HOUR = 20;
var selectAppointment = {
  id: true,
  patientId: true,
  doctorId: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
};
var selectAppointmentWithUsers = {
  ...selectAppointment,
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  }
};
async function checkSlotAvailability(doctorId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone3.default)(startTime).add(3, "hours").toDate();
  const localEndTime = (0, import_moment_timezone3.default)(endTime).add(3, "hours").toDate();
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE: ${(0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone3.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = (0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true
    }
  });
  if (!availability) {
    throw new BadRequest(
      "M\xE9dico n\xE3o possui disponibilidade para este dia da semana"
    );
  }
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  const availabilityStart = appointmentDate.clone().hour(availStartHour).minute(availStartMin);
  const availabilityEnd = appointmentDate.clone().hour(availEndHour).minute(availEndMin);
  const appointmentStart = (0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2);
  const appointmentEnd = (0, import_moment_timezone3.default)(localEndTime).tz(TIMEZONE2);
  console.log(
    `\u{1F4C5} Disponibilidade do m\xE9dico: ${availabilityStart.format(
      "HH:mm"
    )} - ${availabilityEnd.format("HH:mm")}`
  );
  console.log(
    `\u{1F4C5} Hor\xE1rio solicitado: ${appointmentStart.format(
      "HH:mm"
    )} - ${appointmentEnd.format("HH:mm")}`
  );
  if (appointmentStart.isBefore(availabilityStart) || appointmentEnd.isAfter(availabilityEnd)) {
    throw new BadRequest(
      `Hor\xE1rio fora da disponibilidade do m\xE9dico (${availabilityStart.format(
        "HH:mm"
      )} - ${availabilityEnd.format("HH:mm")})`
    );
  }
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: {
        notIn: ["cancelled", "no_show"]
      },
      OR: [
        {
          AND: [
            { startTime: { lte: localStartTime } },
            { endTime: { gt: localStartTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: localEndTime } },
            { endTime: { gte: localEndTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: localStartTime } },
            { endTime: { lte: localEndTime } }
          ]
        }
      ]
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (conflictingAppointment) {
    console.log(
      `\u274C CONFLITO ENCONTRADO: Agendamento ID ${conflictingAppointment.id}`
    );
    console.log(
      `   Hor\xE1rio conflitante: ${(0, import_moment_timezone3.default)(conflictingAppointment.startTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone3.default)(conflictingAppointment.endTime).tz(TIMEZONE2).format("HH:mm")}`
    );
    console.log(
      `   Paciente: ${conflictingAppointment.patient.name} (ID: ${conflictingAppointment.patient.id})`
    );
    console.log(`   Status: ${conflictingAppointment.status}`);
    throw new BadRequest("Este hor\xE1rio j\xE1 est\xE1 ocupado");
  }
  console.log(
    `\u2705 HOR\xC1RIO DISPON\xCDVEL: ${(0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone3.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
}
async function generateAvailableSlots(doctorId, date) {
  console.log(`
=== INICIANDO GERA\xC7\xC3O DE SLOTS ===`);
  console.log(`Data solicitada: ${date}`);
  console.log(`M\xE9dico ID: ${doctorId}`);
  const requestedDate = (0, import_moment_timezone3.default)(date).tz(TIMEZONE2);
  const dayOfWeek = requestedDate.day();
  console.log(`Dia da semana: ${dayOfWeek} (${requestedDate.format("dddd")})`);
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true
    }
  });
  console.log(`Disponibilidade encontrada:`, availability ? "SIM" : "N\xC3O");
  if (availability) {
    console.log(
      `   Hor\xE1rio: ${availability.startTime} - ${availability.endTime}`
    );
    console.log(`   ID: ${availability.id}`);
  }
  if (!availability) {
    console.log(`\u274C NENHUMA DISPONIBILIDADE CONFIGURADA PARA ESTE DIA`);
    console.log(`=== FIM GERA\xC7\xC3O DE SLOTS ===
`);
    return [];
  }
  const startOfDay = requestedDate.clone().startOf("day").toDate();
  const endOfDay = requestedDate.clone().endOf("day").toDate();
  console.log(
    `\u{1F50D} Buscando agendamentos entre: ${(0, import_moment_timezone3.default)(startOfDay).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} e ${(0, import_moment_timezone3.default)(endOfDay).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")}`
  );
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        notIn: ["cancelled", "no_show"]
      }
    },
    orderBy: {
      startTime: "asc"
    }
  });
  console.log(`=== AGENDAMENTOS EXISTENTES PARA ${date} ===`);
  console.log(`M\xE9dico ID: ${doctorId}`);
  console.log(`Total de agendamentos: ${existingAppointments.length}`);
  existingAppointments.forEach((appointment, index) => {
    console.log(
      `${index + 1}. ${(0, import_moment_timezone3.default)(appointment.startTime).tz(TIMEZONE2).format("HH:mm")} - ${(0, import_moment_timezone3.default)(appointment.endTime).tz(TIMEZONE2).format("HH:mm")} (${appointment.status})`
    );
  });
  console.log("==========================================");
  const slots = [];
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  console.log(`
\u{1F4C5} CONFIGURA\xC7\xC3O DE HOR\xC1RIOS:`);
  console.log(
    `   In\xEDcio disponibilidade: ${availStartHour}:${availStartMin.toString().padStart(2, "0")}`
  );
  console.log(
    `   Fim disponibilidade: ${availEndHour}:${availEndMin.toString().padStart(2, "0")}`
  );
  console.log(`   Dura\xE7\xE3o da sess\xE3o: ${SESSION_DURATION_MINUTES} minutos`);
  console.log(`   Intervalo entre sess\xF5es: ${BREAK_DURATION_MINUTES} minutos`);
  const startHour = availStartHour;
  const startMin = availStartMin;
  let currentSlot = requestedDate.clone().hour(startHour).minute(startMin).second(0).millisecond(0);
  const now = (0, import_moment_timezone3.default)().tz(TIMEZONE2);
  const isToday = requestedDate.isSame(now, "day");
  console.log(`
\u23F0 VERIFICA\xC7\xC3O DE HOR\xC1RIO:`);
  console.log(`   \xC9 hoje? ${isToday}`);
  console.log(`   Hor\xE1rio atual: ${now.format("HH:mm")}`);
  console.log(`   Primeiro slot calculado: ${currentSlot.format("HH:mm")}`);
  if (isToday && currentSlot.isBefore(now)) {
    const currentHour = now.hour();
    const currentMinute = now.minute();
    if (currentMinute > 0) {
      currentSlot = now.clone().add(1, "hour").startOf("hour");
    } else {
      currentSlot = now.clone().startOf("hour");
    }
    if (currentSlot.hour() < startHour || currentSlot.hour() === startHour && currentSlot.minute() < startMin) {
      currentSlot = requestedDate.clone().hour(startHour).minute(startMin);
    }
    console.log(`   \u26A0\uFE0F  Hor\xE1rio ajustado para: ${currentSlot.format("HH:mm")}`);
  }
  const availEndTime = requestedDate.clone().hour(availEndHour).minute(availEndMin);
  const serviceEndTime = requestedDate.clone().hour(END_HOUR).minute(0);
  const endTime = availEndTime.isBefore(serviceEndTime) ? availEndTime : serviceEndTime;
  console.log(`
\u{1F504} INICIANDO LOOP DE GERA\xC7\xC3O DE SLOTS:`);
  console.log(
    `   Hor\xE1rio de fim da disponibilidade: ${availEndTime.format("HH:mm")}`
  );
  console.log(
    `   Hor\xE1rio de fim do servi\xE7o: ${serviceEndTime.format("HH:mm")}`
  );
  console.log(`   Hor\xE1rio de fim usado: ${endTime.format("HH:mm")}`);
  console.log(`   Slot inicial: ${currentSlot.format("HH:mm")}`);
  let slotCount = 0;
  while (currentSlot.isBefore(endTime)) {
    slotCount++;
    const slotEnd = currentSlot.clone().add(SESSION_DURATION_MINUTES, "minutes");
    console.log(
      `
   \u{1F4CD} Slot ${slotCount}: ${currentSlot.format(
        "HH:mm"
      )} - ${slotEnd.format("HH:mm")}`
    );
    const conflictingAppointment = existingAppointments.find((appointment) => {
      const appointmentStart = (0, import_moment_timezone3.default)(appointment.startTime).tz(TIMEZONE2);
      const appointmentEnd = (0, import_moment_timezone3.default)(appointment.endTime).tz(TIMEZONE2);
      const slotEndsBeforeAppointment = slotEnd.isSameOrBefore(appointmentStart);
      const slotStartsAfterAppointment = currentSlot.isSameOrAfter(appointmentEnd);
      return !(slotEndsBeforeAppointment || slotStartsAfterAppointment);
    });
    const isAvailable = !conflictingAppointment;
    if (!isAvailable && conflictingAppointment) {
      console.log(
        `     \u274C CONFLITO: Conflita com agendamento ${conflictingAppointment.id}`
      );
      console.log(
        `        Agendamento: ${(0, import_moment_timezone3.default)(conflictingAppointment.startTime).format(
          "HH:mm"
        )} - ${(0, import_moment_timezone3.default)(conflictingAppointment.endTime).format("HH:mm")}`
      );
    }
    const isPastSlot = isToday && currentSlot.isBefore(now);
    if (isPastSlot) {
      console.log(`     \u23F0 PASSADO: Slot j\xE1 passou`);
    }
    console.log(
      `     Status: ${isAvailable && !isPastSlot ? "\u2705 DISPON\xCDVEL" : "\u274C INDISPON\xCDVEL"}`
    );
    if (isAvailable && !isPastSlot && slotEnd.isSameOrBefore(endTime)) {
      const startTimeUTC = import_moment_timezone3.default.utc().year(currentSlot.year()).month(currentSlot.month()).date(currentSlot.date()).hour(currentSlot.hour()).minute(currentSlot.minute()).second(0).millisecond(0);
      const endTimeUTC = import_moment_timezone3.default.utc().year(slotEnd.year()).month(slotEnd.month()).date(slotEnd.date()).hour(slotEnd.hour()).minute(slotEnd.minute()).second(0).millisecond(0);
      slots.push({
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        available: true
      });
      console.log(
        `\u2705 SLOT DISPON\xCDVEL: ${currentSlot.format("HH:mm")} - ${slotEnd.format(
          "HH:mm"
        )}`
      );
    }
    currentSlot.add(
      SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES,
      "minutes"
    );
  }
  console.log(`
\u{1F4CA} RESUMO FINAL:`);
  console.log(`   Total de slots verificados: ${slotCount}`);
  console.log(`   Slots dispon\xEDveis gerados: ${slots.length}`);
  console.log(
    `   Slots dispon\xEDveis:`,
    slots.map((slot) => (0, import_moment_timezone3.default)(slot.startTime).format("HH:mm")).join(", ")
  );
  console.log(`=== FIM GERA\xC7\xC3O DE SLOTS ===
`);
  return slots;
}
async function fixAppointmentTimezones() {
  console.log("\u{1F527} Iniciando corre\xE7\xE3o de timezones dos agendamentos...");
  const appointments = await prisma.appointment.findMany({
    where: {
      status: {
        notIn: ["cancelled", "no_show"]
      }
    }
  });
  console.log(
    `\u{1F4CB} Encontrados ${appointments.length} agendamentos para verificar`
  );
  for (const appointment of appointments) {
    const originalStart = (0, import_moment_timezone3.default)(appointment.startTime);
    const originalEnd = (0, import_moment_timezone3.default)(appointment.endTime);
    const correctedStart = (0, import_moment_timezone3.default)(appointment.startTime).tz(TIMEZONE2);
    const correctedEnd = (0, import_moment_timezone3.default)(appointment.endTime).tz(TIMEZONE2);
    console.log(`\u{1F504} Agendamento ${appointment.id}:`);
    console.log(
      `   Original: ${originalStart.format(
        "DD/MM/YYYY HH:mm"
      )} - ${originalEnd.format("HH:mm")}`
    );
    console.log(
      `   Corrigido: ${correctedStart.format(
        "DD/MM/YYYY HH:mm"
      )} - ${correctedEnd.format("HH:mm")}`
    );
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: correctedStart.toDate(),
        endTime: correctedEnd.toDate()
      }
    });
  }
  console.log("\u2705 Corre\xE7\xE3o de timezones conclu\xEDda!");
}
var createAppointment = async (appointmentData) => {
  const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorIdString, register: "doctor" }
  });
  if (!doctor) {
    throw new Error("M\xE9dico n\xE3o encontrado");
  }
  await checkSlotAvailability(
    doctorIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      doctorId: doctorIdString,
      startTime: (0, import_moment_timezone3.default)(startTime).add(3, "hours").toDate(),
      endTime: (0, import_moment_timezone3.default)(endTime).add(3, "hours").toDate(),
      notes: notes || "",
      status: "scheduled"
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
var createAppointmentForAttendant = async (appointmentData) => {
  const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorIdString, register: "doctor" }
  });
  if (!doctor) {
    throw new Error("M\xE9dico n\xE3o encontrado");
  }
  await checkSlotAvailabilityForAttendant(
    doctorIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      doctorId: doctorIdString,
      startTime: (0, import_moment_timezone3.default)(startTime).add(3, "hours").toDate(),
      endTime: (0, import_moment_timezone3.default)(endTime).add(3, "hours").toDate(),
      notes: notes || "",
      status: "scheduled"
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
async function checkSlotAvailabilityForAttendant(doctorId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone3.default)(startTime).add(3, "hours");
  const localEndTime = (0, import_moment_timezone3.default)(endTime).add(3, "hours");
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE (ATTENDANT): ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = localStartTime.tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true
    }
  });
  if (!availability) {
    throw new BadRequest(
      "M\xE9dico n\xE3o possui disponibilidade para este dia da semana"
    );
  }
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  const availabilityStart = appointmentDate.clone().hour(availStartHour).minute(availStartMin);
  const availabilityEnd = appointmentDate.clone().hour(availEndHour).minute(availEndMin);
  const appointmentStart = localStartTime.tz(TIMEZONE2);
  const appointmentEnd = localEndTime.tz(TIMEZONE2);
  console.log(
    `\u{1F4C5} Disponibilidade do m\xE9dico: ${availabilityStart.format(
      "HH:mm"
    )} - ${availabilityEnd.format("HH:mm")}`
  );
  console.log(
    `\u{1F4C5} Hor\xE1rio solicitado: ${appointmentStart.format(
      "HH:mm"
    )} - ${appointmentEnd.format("HH:mm")}`
  );
  if (appointmentStart.isBefore(availabilityStart) || appointmentEnd.isAfter(availabilityEnd)) {
    throw new BadRequest(
      `Hor\xE1rio fora da disponibilidade do m\xE9dico (${availabilityStart.format(
        "HH:mm"
      )} - ${availabilityEnd.format("HH:mm")})`
    );
  }
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: {
        notIn: ["cancelled", "no_show"]
      },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (conflictingAppointment) {
    console.log(
      `\u274C CONFLITO ENCONTRADO: Agendamento ID ${conflictingAppointment.id}`
    );
    console.log(
      `   Hor\xE1rio conflitante: ${(0, import_moment_timezone3.default)(conflictingAppointment.startTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone3.default)(conflictingAppointment.endTime).tz(TIMEZONE2).format("HH:mm")}`
    );
    console.log(
      `   Paciente: ${conflictingAppointment.patient.name} (ID: ${conflictingAppointment.patient.id})`
    );
    console.log(`   Status: ${conflictingAppointment.status}`);
    throw new BadRequest("Este hor\xE1rio j\xE1 est\xE1 ocupado");
  }
  console.log(
    `\u2705 HOR\xC1RIO DISPON\xCDVEL: ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
}
var canPatientScheduleWithDoctor = async (patientId, doctorId) => {
  try {
    return {
      canSchedule: true
    };
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do paciente:", error);
    return {
      canSchedule: false,
      reason: "Erro ao verificar disponibilidade"
    };
  }
};
function adjustAppointmentTimes(appointments) {
  return appointments.map((appointment) => ({
    ...appointment,
    startTime: appointment.startTime ? (0, import_moment_timezone3.default)(appointment.startTime).subtract(3, "hours").toISOString() : appointment.startTime,
    endTime: appointment.endTime ? (0, import_moment_timezone3.default)(appointment.endTime).subtract(3, "hours").toISOString() : appointment.endTime
  }));
}
async function getPatientAppointments(patientId, status) {
  const where = { patientId };
  if (status) {
    where.status = status;
  }
  const appointments = await prisma.appointment.findMany({
    where,
    select: selectAppointmentWithUsers,
    orderBy: {
      startTime: "desc"
    }
  });
  return adjustAppointmentTimes(appointments);
}
async function getDoctorAppointments(doctorId, startDate, endDate) {
  const where = { doctorId };
  if (startDate && endDate) {
    where.startTime = {
      gte: startDate,
      lte: endDate
    };
  }
  const appointments = await prisma.appointment.findMany({
    where,
    select: selectAppointmentWithUsers,
    orderBy: {
      startTime: "asc"
    }
  });
  return adjustAppointmentTimes(appointments);
}
async function updateAppointmentStatus(appointmentId, status, userId, userRole) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true
    }
  });
  if (!appointment) {
    throw new NotFound("Agendamento n\xE3o encontrado");
  }
  if (userRole === "patient" && appointment.patientId !== userId) {
    throw new Unauthorized(
      "Voc\xEA n\xE3o tem permiss\xE3o para alterar este agendamento"
    );
  }
  if (userRole === "doctor" && appointment.doctorId !== userId) {
    throw new Unauthorized(
      "Voc\xEA n\xE3o tem permiss\xE3o para alterar este agendamento"
    );
  }
  if (appointment.status === "completed" || appointment.status === "no_show") {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel alterar o status de um agendamento finalizado"
    );
  }
  if (status === "cancelled") {
    const now = (0, import_moment_timezone3.default)().tz(TIMEZONE2);
    const appointmentTime = (0, import_moment_timezone3.default)(appointment.startTime).tz(TIMEZONE2);
    const hoursUntilAppointment = appointmentTime.diff(now, "hours");
    if (hoursUntilAppointment < 24) {
      throw new BadRequest(
        "Agendamentos s\xF3 podem ser cancelados com 24h de anteced\xEAncia"
      );
    }
  }
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    select: selectAppointmentWithUsers
  });
  if (status === "cancelled") {
    try {
      await sendAppointmentCancellation(updatedAppointment);
    } catch (error) {
      console.error("Erro ao enviar notifica\xE7\xE3o de cancelamento:", error);
    }
  }
  return updatedAppointment;
}
async function createDoctorAvailability(doctorId, availability) {
  const existing = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      isActive: true
    }
  });
  if (existing) {
    throw new BadRequest(
      "J\xE1 existe disponibilidade configurada para este dia da semana"
    );
  }
  const created = await prisma.availability.create({
    data: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isActive: true
    }
  });
  return created;
}
async function getDoctorAvailability(doctorId) {
  const availabilities = await prisma.availability.findMany({
    where: {
      doctorId,
      isActive: true
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return availabilities;
}
async function deleteDoctorAvailability(availabilityId, doctorId) {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId,
      isActive: true
    }
  });
  if (!availability) {
    throw new NotFound("Disponibilidade n\xE3o encontrada");
  }
  const dayOfWeek = availability.dayOfWeek;
  const startTime = availability.startTime;
  const endTime = availability.endTime;
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: {
        gte: /* @__PURE__ */ new Date()
      },
      status: {
        in: ["scheduled", "confirmed"]
      }
    }
  });
  const conflictingAppointments = futureAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    const appointmentDayOfWeek = appointmentDate.getDay();
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5);
    return appointmentDayOfWeek === dayOfWeek && appointmentTime >= startTime && appointmentTime < endTime;
  });
  if (conflictingAppointments.length > 0) {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel deletar esta disponibilidade pois existem agendamentos futuros"
    );
  }
  await prisma.availability.delete({
    where: {
      id: availabilityId
    }
  });
  return { message: "Disponibilidade deletada com sucesso" };
}
async function cancelAppointmentByAttendant(appointmentId, attendantId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true
    }
  });
  if (!appointment) {
    throw new NotFound("Agendamento n\xE3o encontrado");
  }
  if (appointment.status === "completed" || appointment.status === "no_show" || appointment.status === "cancelled") {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel cancelar um agendamento finalizado ou j\xE1 cancelado"
    );
  }
  const now = (0, import_moment_timezone3.default)().tz(TIMEZONE2);
  const appointmentTime = (0, import_moment_timezone3.default)(appointment.startTime).tz(TIMEZONE2);
  if (appointmentTime.isBefore(now)) {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel cancelar um agendamento que j\xE1 passou"
    );
  }
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
    select: selectAppointmentWithUsers
  });
  try {
    await sendAppointmentCancellation(updatedAppointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de cancelamento:", error);
  }
  return updatedAppointment;
}

// src/controllers/appointmentController.ts
var import_moment_timezone4 = __toESM(require("moment-timezone"));
async function postAppointment(request, reply) {
  const { id: patientId, register } = request.usuario;
  if (register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "M\xE9dicos n\xE3o podem agendar consultas para si mesmos"
    });
  }
  const { doctorId, startTime, notes } = request.body;
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1e3);
  const appointment = await createAppointment({
    patientId,
    doctorId,
    startTime,
    endTime: endDate.toISOString(),
    notes
  });
  return reply.status(201).send({
    status: "success",
    data: appointment
  });
}
async function getAvailableSlotsByPeriod(request, reply) {
  try {
    const { startDate, endDate, doctorId } = request.query;
    if (!doctorId) {
      return reply.status(400).send({
        status: "error",
        message: "doctorId \xE9 obrigat\xF3rio"
      });
    }
    const date = (0, import_moment_timezone4.default)(startDate).format("YYYY-MM-DD");
    const slots = await generateAvailableSlots(doctorId, date);
    return reply.status(200).send({
      status: "success",
      data: slots
    });
  } catch (error) {
    console.error("Erro ao buscar hor\xE1rios dispon\xEDveis:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function getAvailableSlots(request, reply) {
  const { doctorId, date } = request.query;
  const slots = await generateAvailableSlots(doctorId, date);
  return reply.status(200).send({
    status: "success",
    data: slots
  });
}
async function getMyAppointments(request, reply) {
  const { id: userId, register } = request.usuario;
  const { status } = request.query;
  let appointments;
  if (register === "doctor") {
    const { startDate, endDate } = request.query;
    const start = startDate ? new Date(startDate) : void 0;
    const end = endDate ? new Date(endDate) : void 0;
    appointments = await getDoctorAppointments(userId, start, end);
  } else {
    appointments = await getPatientAppointments(userId, status);
  }
  return reply.status(200).send({
    status: "success",
    data: appointments
  });
}
async function putAppointmentStatus(request, reply) {
  const { id: appointmentId } = request.params;
  const { status } = request.body;
  const { id: userId, register } = request.usuario;
  const updatedAppointment = await updateAppointmentStatus(
    appointmentId,
    status,
    userId,
    register
  );
  return reply.status(200).send({
    status: "success",
    data: updatedAppointment
  });
}
async function postAvailability(request, reply) {
  try {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas m\xE9dicos podem configurar disponibilidade"
      });
    }
    const availability = request.body;
    const created = await createDoctorAvailability(doctorId, availability);
    return reply.status(201).send({
      status: "success",
      data: created
    });
  } catch (error) {
    if (error.message?.includes("J\xE1 existe disponibilidade")) {
      return reply.status(400).send({
        status: "error",
        message: error.message
      });
    }
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function getAvailability(request, reply) {
  const { doctorId } = request.params;
  const availabilities = await getDoctorAvailability(doctorId);
  return reply.status(200).send({
    status: "success",
    data: availabilities
  });
}
async function getTodayAppointments(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas m\xE9dicos podem acessar esta rota"
    });
  }
  const today = (0, import_moment_timezone4.default)().tz("America/Sao_Paulo");
  const startOfDay = today.clone().startOf("day").toDate();
  const endOfDay = today.clone().endOf("day").toDate();
  const appointments = await getDoctorAppointments(
    doctorId,
    startOfDay,
    endOfDay
  );
  return reply.status(200).send({
    status: "success",
    data: appointments
  });
}
async function postAppointmentForPatient(request, reply) {
  const { id: currentUserId, register } = request.usuario;
  if (register !== "doctor" && register !== "attendant") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas m\xE9dicos podem criar agendamentos para pacientes"
    });
  }
  const { patientId, doctorId, startTime, notes } = request.body;
  const patient = await prisma.users.findUnique({
    where: { id: patientId },
    select: { id: true, register: true }
  });
  if (!patient) {
    return reply.status(404).send({
      status: "error",
      message: "Paciente n\xE3o encontrado"
    });
  }
  if (patient.register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "N\xE3o \xE9 poss\xEDvel agendar consulta para outro m\xE9dico"
    });
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorId },
    select: { id: true, register: true }
  });
  if (!doctor || doctor.register !== "doctor") {
    return reply.status(404).send({
      status: "error",
      message: "M\xE9dico n\xE3o encontrado"
    });
  }
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1e3);
  let appointment;
  if (register === "attendant") {
    appointment = await createAppointmentForAttendant({
      patientId,
      doctorId,
      startTime,
      endTime: endDate.toISOString(),
      notes
    });
  } else {
    appointment = await createAppointment({
      patientId,
      doctorId,
      startTime,
      endTime: endDate.toISOString(),
      notes
    });
  }
  return reply.status(201).send({
    status: "success",
    data: appointment
  });
}
async function deleteAvailability(request, reply) {
  try {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas m\xE9dicos podem deletar disponibilidade"
      });
    }
    const { availabilityId } = request.params;
    const result = await deleteDoctorAvailability(availabilityId, doctorId);
    return reply.status(200).send({
      status: "success",
      data: result
    });
  } catch (error) {
    if (error.message?.includes("n\xE3o encontrada")) {
      return reply.status(404).send({
        status: "error",
        message: error.message
      });
    }
    if (error.message?.includes("agendamentos futuros")) {
      return reply.status(400).send({
        status: "error",
        message: error.message
      });
    }
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function cancelAppointmentByAttendantController(request, reply) {
  try {
    const { id: attendantId, register } = request.usuario;
    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem cancelar agendamentos"
      });
    }
    const { appointmentId } = request.params;
    const cancelledAppointment = await cancelAppointmentByAttendant(
      appointmentId,
      attendantId
    );
    return reply.status(200).send({
      status: "success",
      data: cancelledAppointment
    });
  } catch (error) {
    if (error.message?.includes("n\xE3o encontrado")) {
      return reply.status(404).send({
        status: "error",
        message: error.message
      });
    }
    if (error.message?.includes("N\xE3o \xE9 poss\xEDvel cancelar")) {
      return reply.status(400).send({
        status: "error",
        message: error.message
      });
    }
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function getUserAppointments(request, reply) {
  try {
    const { id: attendantId, register } = request.usuario;
    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem acessar esta rota"
      });
    }
    const { userId } = request.params;
    const { status } = request.query;
    const appointments = await getPatientAppointments(userId, status);
    return reply.status(200).send({
      status: "success",
      data: appointments
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos do usu\xE1rio:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function checkPatientDoctorAvailability(request, reply) {
  try {
    const { patientId, doctorId } = request.params;
    const availability = await canPatientScheduleWithDoctor(
      patientId,
      doctorId
    );
    return reply.status(200).send({
      status: "success",
      data: availability
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function fixAppointmentTimezonesController(request, reply) {
  try {
    await fixAppointmentTimezones();
    return reply.status(200).send({
      status: "success",
      message: "Timezones dos agendamentos corrigidos com sucesso"
    });
  } catch (error) {
    console.error("Erro ao corrigir timezones:", error);
    return reply.status(500).send({
      status: "error",
      message: error.message || "Erro interno do servidor"
    });
  }
}

// src/docs/appointment.ts
var import_v46 = require("zod/v4");

// src/types/appointment.ts
var import_v45 = require("zod/v4");
var appointmentStatusEnum = import_v45.z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);
var responseAppointmentSchemaProps = {
  id: import_v45.z.string(),
  patientId: import_v45.z.string(),
  doctorId: import_v45.z.string(),
  startTime: import_v45.z.string(),
  endTime: import_v45.z.string(),
  status: appointmentStatusEnum,
  notes: import_v45.z.string().nullish(),
  googleEventId: import_v45.z.string().nullish(),
  createdAt: import_v45.z.string(),
  updatedAt: import_v45.z.string()
};
var responseAppointmentSchema = import_v45.z.object(
  responseAppointmentSchemaProps
);
var responseAppointmentWithUsersSchema = responseAppointmentSchema.extend({
  patient: import_v45.z.object({
    id: import_v45.z.string(),
    name: import_v45.z.string().nullish(),
    email: import_v45.z.string(),
    phone: import_v45.z.string().nullish()
  }),
  doctor: import_v45.z.object({
    id: import_v45.z.string(),
    name: import_v45.z.string().nullish(),
    email: import_v45.z.string(),
    phone: import_v45.z.string().nullish()
  })
});
var createAppointmentSchema = import_v45.z.object({
  doctorId: import_v45.z.string().min(1, "ID do m\xE9dico \xE9 obrigat\xF3rio"),
  startTime: import_v45.z.string(),
  notes: import_v45.z.string().optional()
});
var updateAppointmentSchema = import_v45.z.object({
  startTime: import_v45.z.string().optional(),
  status: appointmentStatusEnum.optional(),
  notes: import_v45.z.string().optional()
});
var getAvailableSlotsSchema = import_v45.z.object({
  doctorId: import_v45.z.string().min(1, "ID do m\xE9dico \xE9 obrigat\xF3rio"),
  date: import_v45.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});
var availabilitySchema = import_v45.z.object({
  dayOfWeek: import_v45.z.number().min(0).max(6),
  startTime: import_v45.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  endTime: import_v45.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  isActive: import_v45.z.boolean().optional()
});
var responseAvailabilitySchema = availabilitySchema.extend({
  id: import_v45.z.string(),
  doctorId: import_v45.z.string(),
  createdAt: import_v45.z.string(),
  updatedAt: import_v45.z.string()
});

// src/docs/appointment.ts
var errorResponseSchema2 = import_v46.z.object({
  status: import_v46.z.literal("error"),
  message: import_v46.z.string()
});
var attendanceSchema = import_v46.z.object({
  id: import_v46.z.string(),
  patientId: import_v46.z.string(),
  doctorId: import_v46.z.string(),
  description: import_v46.z.string(),
  date: import_v46.z.string(),
  createdAt: import_v46.z.string(),
  updatedAt: import_v46.z.string(),
  patient: import_v46.z.object({
    id: import_v46.z.string(),
    name: import_v46.z.string().nullish(),
    email: import_v46.z.string(),
    phone: import_v46.z.string().nullish()
  }).optional(),
  doctor: import_v46.z.object({
    id: import_v46.z.string(),
    name: import_v46.z.string().nullish(),
    email: import_v46.z.string(),
    phone: import_v46.z.string().nullish()
  }).optional()
});
var createAttendanceSchema = import_v46.z.object({
  patientId: import_v46.z.string(),
  description: import_v46.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_v46.z.string().optional()
  // pode ser preenchido automaticamente
});
var createAppointmentForPatientSchema = import_v46.z.object({
  patientId: import_v46.z.string().describe("ID do paciente"),
  doctorId: import_v46.z.string().describe("ID do m\xE9dico (pode ser o pr\xF3prio m\xE9dico logado)"),
  startTime: import_v46.z.string().describe("Data e hora de in\xEDcio do agendamento"),
  notes: import_v46.z.string().optional().describe("Observa\xE7\xF5es sobre o agendamento")
});
var appointmentDocs = class {
};
appointmentDocs.postAppointment = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Criar novo agendamento",
    description: "Cria um novo agendamento. Pacientes podem agendar m\xFAltiplas consultas conforme disponibilidade.",
    headers: headersSchema,
    body: createAppointmentSchema,
    response: {
      201: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getAvailableSlotsByPeriod = {
  schema: {
    tags: ["Appointment"],
    summary: "Buscar hor\xE1rios dispon\xEDveis por per\xEDodo",
    description: "Retorna os hor\xE1rios dispon\xEDveis de um m\xE9dico em uma data espec\xEDfica usando startDate e endDate (compatibilidade com frontend)",
    querystring: import_v46.z.object({
      startDate: import_v46.z.string().describe("Data de in\xEDcio no formato ISO"),
      endDate: import_v46.z.string().describe("Data de fim no formato ISO"),
      doctorId: import_v46.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(
          import_v46.z.object({
            startTime: import_v46.z.string(),
            endTime: import_v46.z.string(),
            available: import_v46.z.boolean()
          })
        )
      }),
      400: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getAvailableSlots = {
  schema: {
    tags: ["Appointment"],
    summary: "Buscar hor\xE1rios dispon\xEDveis",
    description: "Retorna os hor\xE1rios dispon\xEDveis de um m\xE9dico em uma data espec\xEDfica",
    querystring: getAvailableSlotsSchema,
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(
          import_v46.z.object({
            startTime: import_v46.z.string(),
            endTime: import_v46.z.string(),
            available: import_v46.z.boolean()
          })
        )
      }),
      400: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getMyAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Buscar meus agendamentos",
    description: "Retorna os agendamentos do usu\xE1rio logado (paciente ou m\xE9dico)",
    headers: headersSchema,
    querystring: import_v46.z.object({
      status: appointmentStatusEnum.optional(),
      startDate: import_v46.z.string().optional(),
      endDate: import_v46.z.string().optional()
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.putAppointmentStatus = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Atualizar status do agendamento",
    description: "Atualiza o status de um agendamento. Pacientes s\xF3 podem alterar seus pr\xF3prios agendamentos, m\xE9dicos s\xF3 podem alterar seus agendamentos.",
    headers: headersSchema,
    params: import_v46.z.object({
      id: import_v46.z.string().describe("ID do agendamento")
    }),
    body: import_v46.z.object({
      status: import_v46.z.enum([
        "scheduled",
        "confirmed",
        "cancelled",
        "completed",
        "no_show"
      ])
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.cancelAppointmentByAttendant = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Cancelar agendamento (attendant)",
    description: "Permite que atendentes cancelem agendamentos. N\xE3o \xE9 poss\xEDvel cancelar agendamentos que j\xE1 passaram ou foram finalizados.",
    headers: headersSchema,
    params: import_v46.z.object({
      appointmentId: import_v46.z.string().describe("ID do agendamento a ser cancelado")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.postAvailability = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Availability"],
    summary: "Configurar disponibilidade",
    description: "Configura a disponibilidade do m\xE9dico para um dia da semana",
    headers: headersSchema,
    body: availabilitySchema,
    response: {
      201: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: responseAvailabilitySchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getAvailability = {
  schema: {
    tags: ["Availability"],
    summary: "Buscar disponibilidade do m\xE9dico",
    description: "Retorna a disponibilidade configurada de um m\xE9dico",
    params: import_v46.z.object({
      doctorId: import_v46.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(responseAvailabilitySchema)
      }),
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.deleteAvailability = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Availability"],
    summary: "Deletar disponibilidade do m\xE9dico",
    description: "Deleta uma disponibilidade espec\xEDfica do m\xE9dico logado. N\xE3o \xE9 poss\xEDvel deletar se houver agendamentos futuros.",
    headers: headersSchema,
    params: import_v46.z.object({
      availabilityId: import_v46.z.string().describe("ID da disponibilidade a ser deletada")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.object({
          message: import_v46.z.string()
        })
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getTodayAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Agendamentos do dia",
    description: "Retorna os agendamentos do dia para o m\xE9dico logado",
    headers: headersSchema,
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.postAppointmentForPatient = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Criar agendamento para paciente (profissional)",
    description: "Permite que profissionais criem agendamentos para pacientes. Apenas m\xE9dicos podem usar esta rota.",
    headers: headersSchema,
    body: createAppointmentForPatientSchema,
    response: {
      201: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: responseAppointmentWithUsersSchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.getUserAppointments = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Appointment"],
    summary: "Buscar agendamentos de um usu\xE1rio (atendente)",
    description: "Permite que atendentes busquem agendamentos de um usu\xE1rio espec\xEDfico pelo ID",
    headers: headersSchema,
    params: import_v46.z.object({
      userId: import_v46.z.string().describe("ID do usu\xE1rio")
    }),
    querystring: import_v46.z.object({
      status: import_v46.z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional().describe("Filtrar por status do agendamento")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(responseAppointmentWithUsersSchema)
      }),
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.checkPatientDoctorAvailability = {
  schema: {
    tags: ["Appointment"],
    summary: "Verificar se paciente pode agendar com profissional",
    description: "Verifica se um paciente pode agendar com um profissional espec\xEDfico (sempre permite agendamento)",
    params: import_v46.z.object({
      patientId: import_v46.z.string().describe("ID do paciente"),
      doctorId: import_v46.z.string().describe("ID do profissional")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.object({
          canSchedule: import_v46.z.boolean(),
          reason: import_v46.z.string().optional(),
          existingAppointment: import_v46.z.object({
            id: import_v46.z.string(),
            startTime: import_v46.z.string(),
            endTime: import_v46.z.string(),
            status: import_v46.z.string(),
            doctor: import_v46.z.object({
              id: import_v46.z.string(),
              name: import_v46.z.string()
            })
          }).optional()
        })
      }),
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.generateAvailableSlots = {
  schema: {
    tags: ["Appointment"],
    summary: "Gerar hor\xE1rios dispon\xEDveis",
    description: "Gera hor\xE1rios dispon\xEDveis para um m\xE9dico em uma data espec\xEDfica",
    params: import_v46.z.object({
      doctorId: import_v46.z.string().describe("ID do m\xE9dico"),
      date: import_v46.z.string().describe("Data no formato YYYY-MM-DD")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(
          import_v46.z.object({
            time: import_v46.z.string(),
            available: import_v46.z.boolean()
          })
        )
      }),
      400: errorResponseSchema2,
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
appointmentDocs.fixAppointmentTimezones = {
  schema: {
    tags: ["Appointment"],
    summary: "Corrigir timezones dos agendamentos",
    description: "Corrige os timezones de todos os agendamentos existentes (usar apenas uma vez)",
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        message: import_v46.z.string()
      }),
      500: errorResponseSchema2
    }
  }
};
var attendanceDocs = class {
};
attendanceDocs.postAttendance = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Registrar atendimento",
    description: "Profissional registra um atendimento realizado para um paciente.",
    headers: headersSchema,
    body: createAttendanceSchema,
    response: {
      201: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: attendanceSchema
      }),
      400: errorResponseSchema2,
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
attendanceDocs.getMyAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos do usu\xE1rio",
    description: "Retorna todos os atendimentos realizados para o usu\xE1rio logado.",
    headers: headersSchema,
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(attendanceSchema)
      }),
      401: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};
attendanceDocs.getPatientAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos de um paciente",
    description: "Profissional visualiza todos os atendimentos de um paciente espec\xEDfico.",
    headers: headersSchema,
    params: import_v46.z.object({
      id: import_v46.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_v46.z.object({
        status: import_v46.z.literal("success"),
        data: import_v46.z.array(attendanceSchema)
      }),
      401: errorResponseSchema2,
      403: errorResponseSchema2,
      404: errorResponseSchema2,
      500: errorResponseSchema2
    }
  }
};

// src/routes/appointment/appointmentRoutes.ts
async function appointmentRoutes(app2) {
  app2.withTypeProvider().post("/appointments", appointmentDocs.postAppointment, postAppointment);
  app2.withTypeProvider().post(
    "/appointments/create-for-patient",
    appointmentDocs.postAppointmentForPatient,
    postAppointmentForPatient
  );
  app2.withTypeProvider().get(
    "/appointments/available-slots",
    appointmentDocs.getAvailableSlots,
    getAvailableSlots
  );
  app2.withTypeProvider().get(
    "/appointments",
    appointmentDocs.getAvailableSlotsByPeriod,
    getAvailableSlotsByPeriod
  );
  app2.withTypeProvider().get(
    "/appointments/my",
    appointmentDocs.getMyAppointments,
    getMyAppointments
  );
  app2.withTypeProvider().get(
    "/appointments/user/:userId",
    appointmentDocs.getUserAppointments,
    getUserAppointments
  );
  app2.withTypeProvider().get(
    "/appointments/today",
    appointmentDocs.getTodayAppointments,
    getTodayAppointments
  );
  app2.withTypeProvider().put(
    "/appointments/:id/status",
    appointmentDocs.putAppointmentStatus,
    putAppointmentStatus
  );
  app2.withTypeProvider().put(
    "/appointments/:appointmentId/cancel",
    appointmentDocs.cancelAppointmentByAttendant,
    cancelAppointmentByAttendantController
  );
  app2.withTypeProvider().get(
    "/appointments/check-availability/:patientId/:doctorId",
    appointmentDocs.checkPatientDoctorAvailability,
    checkPatientDoctorAvailability
  );
  app2.withTypeProvider().post(
    "/appointments/fix-timezones",
    appointmentDocs.fixAppointmentTimezones,
    fixAppointmentTimezonesController
  );
  app2.withTypeProvider().post("/availability", appointmentDocs.postAvailability, postAvailability);
  app2.withTypeProvider().get(
    "/availability/:doctorId",
    appointmentDocs.getAvailability,
    getAvailability
  );
  app2.withTypeProvider().delete(
    "/availability/:availabilityId",
    appointmentDocs.deleteAvailability,
    deleteAvailability
  );
}

// src/controllers/attendanceController.ts
async function postAttendance(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem registrar atendimentos"
    });
  }
  const { patientId, description, date } = request.body;
  const attendance = await prisma.attendance.create({
    data: {
      patientId,
      doctorId,
      description,
      date: date ? new Date(date) : void 0
    },
    include: {
      patient: true,
      doctor: true
    }
  });
  return reply.status(201).send({
    status: "success",
    data: attendance
  });
}
async function getMyAttendances(request, reply) {
  const { id: userId, register } = request.usuario;
  let where = {};
  if (register === "doctor") {
    where = { doctorId: userId };
  } else {
    where = { patientId: userId };
  }
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
async function getPatientAttendances(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem acessar o hist\xF3rico de pacientes"
    });
  }
  const { id: patientId } = request.params;
  const attendances = await prisma.attendance.findMany({
    where: { patientId },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}

// src/docs/attendance.ts
var import_v47 = require("zod/v4");
var errorResponseSchema3 = import_v47.z.object({
  status: import_v47.z.literal("error"),
  message: import_v47.z.string()
});
var attendanceSchema2 = import_v47.z.object({
  id: import_v47.z.string(),
  patientId: import_v47.z.string(),
  doctorId: import_v47.z.string(),
  description: import_v47.z.string(),
  date: import_v47.z.string(),
  createdAt: import_v47.z.string(),
  updatedAt: import_v47.z.string(),
  patient: import_v47.z.object({
    id: import_v47.z.string(),
    name: import_v47.z.string().nullish(),
    email: import_v47.z.string(),
    phone: import_v47.z.string().nullish()
  }).optional(),
  doctor: import_v47.z.object({
    id: import_v47.z.string(),
    name: import_v47.z.string().nullish(),
    email: import_v47.z.string(),
    phone: import_v47.z.string().nullish()
  }).optional()
});
var createAttendanceSchema2 = import_v47.z.object({
  patientId: import_v47.z.string(),
  description: import_v47.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_v47.z.string().optional()
  // pode ser preenchido automaticamente
});
var attendanceDocs2 = class {
};
attendanceDocs2.postAttendance = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Registrar atendimento",
    description: "Profissional registra um atendimento realizado para um paciente.",
    headers: headersSchema,
    body: createAttendanceSchema2,
    response: {
      201: import_v47.z.object({
        status: import_v47.z.literal("success"),
        data: attendanceSchema2
      }),
      400: errorResponseSchema3,
      401: errorResponseSchema3,
      403: errorResponseSchema3,
      500: errorResponseSchema3
    }
  }
};
attendanceDocs2.getMyAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos do usu\xE1rio",
    description: "Retorna todos os atendimentos realizados para o usu\xE1rio logado.",
    headers: headersSchema,
    response: {
      200: import_v47.z.object({
        status: import_v47.z.literal("success"),
        data: import_v47.z.array(attendanceSchema2)
      }),
      401: errorResponseSchema3,
      500: errorResponseSchema3
    }
  }
};
attendanceDocs2.getPatientAttendances = {
  preHandler: [autenticarToken],
  schema: {
    tags: ["Attendance"],
    summary: "Hist\xF3rico de atendimentos de um paciente",
    description: "Profissional visualiza todos os atendimentos de um paciente espec\xEDfico.",
    headers: headersSchema,
    params: import_v47.z.object({
      id: import_v47.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_v47.z.object({
        status: import_v47.z.literal("success"),
        data: import_v47.z.array(attendanceSchema2)
      }),
      401: errorResponseSchema3,
      403: errorResponseSchema3,
      404: errorResponseSchema3,
      500: errorResponseSchema3
    }
  }
};

// src/routes/attendance/attendanceRoutes.ts
async function attendanceRoutes(app2) {
  app2.withTypeProvider().post("/attendances", {
    schema: attendanceDocs2.postAttendance.schema,
    preHandler: attendanceDocs2.postAttendance.preHandler,
    handler: postAttendance
  });
  app2.withTypeProvider().get("/attendances/my", {
    schema: attendanceDocs2.getMyAttendances.schema,
    preHandler: attendanceDocs2.getMyAttendances.preHandler,
    handler: getMyAttendances
  });
  app2.withTypeProvider().get("/attendances/patient/:id", {
    schema: attendanceDocs2.getPatientAttendances.schema,
    preHandler: attendanceDocs2.getPatientAttendances.preHandler,
    handler: getPatientAttendances
  });
}

// src/server.ts
var app = (0, import_fastify.default)({
  logger: false,
  serializerOpts: {
    rounding: "floor"
  },
  // Configuração para lidar com content-type e body
  bodyLimit: 1048576,
  // 1MB
  trustProxy: true
});
app.register(import_cors.default, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});
app.register(import_jwt.default, {
  secret: process.env.JWT_SECRET || "your-secret-key"
});
app.register(import("@fastify/multipart"), {
  limits: {
    fileSize: 15 * 1024 * 1024
    // 15MB
  }
});
app.register(import_swagger.default, {
  swagger: {
    consumes: ["application/json", "multipart/form-data"],
    produces: ["application/json"],
    info: {
      title: "pass.in",
      description: "Especifica\xE7\xF5es da API para o back-end da aplica\xE7\xE3o Agendamento",
      version: "1/"
    }
  },
  transform: import_fastify_type_provider_zod.jsonSchemaTransform
});
app.register(import_swagger_ui.default, {
  routePrefix: "/docs"
});
app.setValidatorCompiler(import_fastify_type_provider_zod.validatorCompiler);
app.setSerializerCompiler(import_fastify_type_provider_zod.serializerCompiler);
app.addHook("preSerialization", async (request, reply, payload) => {
  if (payload && typeof payload === "object") {
    const serializeDates = (obj) => {
      if (obj === null || obj === void 0) return obj;
      if (obj instanceof Date) {
        return obj.toISOString();
      }
      if (Array.isArray(obj)) {
        return obj.map(serializeDates);
      }
      if (typeof obj === "object") {
        const serialized = {};
        for (const [key, value] of Object.entries(obj)) {
          serialized[key] = serializeDates(value);
        }
        return serialized;
      }
      return obj;
    };
    return serializeDates(payload);
  }
  return payload;
});
app.register(usuarioRoutes);
app.register(appointmentRoutes);
app.register(attendanceRoutes);
app.setErrorHandler(errorHandler);
app.listen({
  host: "0.0.0.0",
  port: 4e3
}).then(() => {
  console.log("\u{1F680} HTTP Server Running!");
}).catch((err) => {
  console.error("Erro ao subir o servidor:", err);
  process.exit(1);
});
