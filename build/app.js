"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
var app_exports = {};
__export(app_exports, {
  build: () => build
});
module.exports = __toCommonJS(app_exports);
var import_fastify = __toESM(require("fastify"));
var import_jwt = __toESM(require("@fastify/jwt"));

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/service/usuarioService.service.ts
var import_bcrypt = __toESM(require("bcrypt"));

// src/_errors/unauthorized.ts
var Unauthorized = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthorized";
  }
};

// src/_errors/bad-request.ts
var BadRequest = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest";
  }
};

// src/service/usuarioService.service.ts
var import_moment_timezone = __toESM(require("moment-timezone"));

// src/_errors/not-found.ts
var NotFound = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFound";
  }
};

// src/service/usuarioService.service.ts
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
async function authenticateUser(email, password, fastify) {
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
  const token = await fastify.jwt.sign(
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
var import_v43 = require("zod/v4");

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

// src/routes/user/usuarioRoutes.ts
async function usuarioRoutes(app) {
  app.withTypeProvider().get("/user", usuarioDocs.getUsuario, getUsuario);
  app.withTypeProvider().get("/doctors", usuarioDocs.getDoctors, getDoctors);
  app.withTypeProvider().get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);
  app.withTypeProvider().get("/users/:id", usuarioDocs.getUsuarioById, getUsuarioById);
  app.withTypeProvider().post("/user/login", usuarioDocs.loginUsuario, loginUsuario);
  app.withTypeProvider().post("/user", usuarioDocs.postUsuario, createUsuario);
  app.withTypeProvider().post("/user/admin", usuarioDocs.postUsuarioAdmin, createUsuarioAdmin);
  app.withTypeProvider().put("/user", usuarioDocs.putUsuario, updateUsuario);
  app.withTypeProvider().put("/user/:id", usuarioDocs.putUsuarioByDoctor, updateUsuarioByDoctor);
  app.withTypeProvider().delete("/user/:id", usuarioDocs.deleteUsuario, deleteUsuario);
}

// src/app.ts
function build(opts = {}) {
  const app = (0, import_fastify.default)(opts);
  app.register(import_jwt.default, {
    secret: process.env.JWT_SECRET || "your-secret-key"
  });
  app.register(usuarioRoutes);
  return app;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  build
});
