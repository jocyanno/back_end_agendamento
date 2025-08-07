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

// src/tests/utils/testHelpers.ts
var testHelpers_exports = {};
__export(testHelpers_exports, {
  cleanDatabase: () => cleanDatabase,
  createTestApp: () => createTestApp,
  createTestUser: () => createTestUser,
  generateToken: () => generateToken
});
module.exports = __toCommonJS(testHelpers_exports);
var import_fastify = __toESM(require("fastify"));
var import_jwt = __toESM(require("@fastify/jwt"));

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/tests/utils/testHelpers.ts
var import_bcrypt2 = __toESM(require("bcrypt"));

// src/controllers/usuarioController.ts
var import_client2 = require("@prisma/client");

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
  createdAt: true,
  updatedAt: true
};
function serializeUser(user) {
  return {
    ...user,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
  };
}
function serializeUserOrganizations(userOrganizations) {
  return userOrganizations.map((uo) => ({
    organizationId: uo.organization.id,
    role: uo.role,
    organizationName: uo.organization.name,
    joinedAt: uo.joinedAt ? uo.joinedAt.toISOString() : null,
    createdAt: uo.createdAt ? uo.createdAt.toISOString() : null,
    updatedAt: uo.updatedAt ? uo.updatedAt.toISOString() : null
  }));
}
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
  const userOrganizations = await prisma.userOrganization.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  let primaryRole = "member";
  let primaryOrganizationId = null;
  if (userOrganizations.length > 0) {
    const rolePriority = {
      owner: 6,
      admin: 5,
      professional: 4,
      attendant: 3,
      patient: 2,
      member: 1
    };
    let highestPriority = 0;
    for (const userOrg of userOrganizations) {
      const priority = rolePriority[userOrg.role] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = userOrg.role;
        primaryOrganizationId = userOrg.organization.id;
      }
    }
  }
  const token = await fastify.jwt.sign(
    {
      userId: user.id,
      primaryRole,
      primaryOrganizationId,
      userOrganizations: serializeUserOrganizations(userOrganizations)
    },
    { expiresIn: "7d" }
  );
  return {
    token,
    usuario: {
      ...serializeUser(userWithoutPassword),
      primaryRole,
      primaryOrganizationId,
      organizations: userOrganizations.map((uo) => ({
        id: uo.organization.id,
        name: uo.organization.name,
        role: uo.role
      }))
    }
  };
}
async function searchUsuario(usuarioId) {
  const user = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    include: {
      userOrganizations: {
        where: { isActive: true },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  let primaryRole = "member";
  let primaryOrganizationId = null;
  const organizations = [];
  if (user.userOrganizations.length > 0) {
    const rolePriority = {
      owner: 6,
      admin: 5,
      professional: 4,
      attendant: 3,
      patient: 2,
      member: 1
    };
    let highestPriority = 0;
    for (const userOrg of user.userOrganizations) {
      const priority = rolePriority[userOrg.role] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = userOrg.role;
        primaryOrganizationId = userOrg.organizationId;
      }
      organizations.push({
        organizationId: userOrg.organizationId,
        role: userOrg.role,
        organizationName: userOrg.organization.name,
        joinedAt: userOrg.joinedAt ? userOrg.joinedAt.toISOString() : null,
        createdAt: userOrg.createdAt ? userOrg.createdAt.toISOString() : null,
        updatedAt: userOrg.updatedAt ? userOrg.updatedAt.toISOString() : null
      });
    }
  }
  return {
    ...serializeUser(user),
    primaryRole,
    primaryOrganizationId,
    organizations
  };
}
var getUsuarioLogado = async (request) => {
  const usuarioId = request.usuario.id;
  return searchUsuario(usuarioId);
};
var getUsuarioLogadoIsAdmin = async (request) => {
  const { id: usuarioId, primaryRole } = request.usuario;
  const allowedRoles = ["professional", "admin", "owner"];
  if (!allowedRoles.includes(primaryRole)) {
    throw new Unauthorized("User is not authorized");
  }
  return searchUsuario(usuarioId);
};
async function getUserExisting({
  email,
  cpf
}) {
  console.log("=== VALIDANDO EMAIL E CPF ===");
  console.log("Email:", email);
  console.log("CPF:", cpf);
  if (email) {
    const existingUserByEmail = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true }
    });
    if (existingUserByEmail) {
      console.log("Email j\xE1 existe:", email);
      throw new BadRequest(`Email ${email} j\xE1 est\xE1 em uso`);
    }
  }
  if (cpf) {
    const existingUserByCpf = await prisma.users.findUnique({
      where: { cpf },
      select: { id: true, cpf: true }
    });
    if (existingUserByCpf) {
      console.log("CPF j\xE1 existe:", cpf);
      throw new BadRequest(`CPF ${cpf} j\xE1 est\xE1 em uso`);
    }
  }
  console.log("Email e CPF dispon\xEDveis para uso");
  return;
}
async function createUser(data) {
  console.log("=== CREATE USER ===");
  console.log("Dados recebidos:", JSON.stringify(data, null, 2));
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
  console.log("Usu\xE1rio criado com sucesso:", user.email);
  return {
    ...serializeUser(user),
    primaryRole: "member",
    primaryOrganizationId: null,
    organizations: []
  };
}
async function createUserAdmin(data) {
  console.log("=== CREATE USER ADMIN ===");
  console.log("Dados recebidos:", JSON.stringify(data, null, 2));
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
  console.log("Usu\xE1rio criado com sucesso:", user.email);
  return {
    ...serializeUser(user),
    primaryRole: "member",
    primaryOrganizationId: null,
    organizations: []
  };
}
async function updateUser(usuarioId, data) {
  try {
    console.log("=== UPDATE USER SERVICE ===");
    console.log("UsuarioId:", usuarioId);
    console.log("Dados recebidos:", JSON.stringify(data, null, 2));
    const allowedData = data;
    const searchUser = await prisma.users.findUnique({
      where: {
        id: usuarioId
      },
      select: selectUsuario
    });
    console.log("Usu\xE1rio encontrado:", searchUser ? "Sim" : "N\xE3o");
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
      console.log("Criptografando senha...");
      allowedData.password = await import_bcrypt.default.hash(
        allowedData.password,
        10
      );
    }
    if (allowedData.birthDate && typeof allowedData.birthDate === "string") {
      console.log("Convertendo birthDate para Date...");
      allowedData.birthDate = new Date(allowedData.birthDate);
    }
    const dadosLimpos = Object.fromEntries(
      Object.entries(allowedData).filter(
        ([_, value]) => value !== null && value !== void 0
      )
    );
    console.log(
      "Dados limpos para atualiza\xE7\xE3o:",
      JSON.stringify(dadosLimpos, null, 2)
    );
    if (dadosLimpos.numberOfAddress === "" || dadosLimpos.numberOfAddress === null) {
      console.log("Removendo numberOfAddress vazio...");
      delete dadosLimpos.numberOfAddress;
    }
    const camposEndereco = [
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "complement"
    ];
    camposEndereco.forEach((campo) => {
      if (dadosLimpos[campo] === "" || dadosLimpos[campo] === null) {
        console.log(`Removendo ${campo} vazio...`);
        delete dadosLimpos[campo];
      }
    });
    const camposProblema = Object.entries(dadosLimpos).filter(
      ([key, value]) => {
        if (value === "" || value === "null" || value === "undefined") {
          console.log(`Campo problem\xE1tico encontrado: ${key} = ${value}`);
          return true;
        }
        return false;
      }
    );
    if (camposProblema.length > 0) {
      console.log("Removendo campos com valores vazios ou inv\xE1lidos...");
      camposProblema.forEach(([key, value]) => {
        delete dadosLimpos[key];
      });
    }
    console.log(
      "Dados finais para atualiza\xE7\xE3o:",
      JSON.stringify(dadosLimpos, null, 2)
    );
    const usuarioAtualizado = await prisma.users.update({
      where: { id: usuarioId },
      data: {
        ...dadosLimpos
      },
      select: selectUsuario
    });
    console.log("Usu\xE1rio atualizado com sucesso no banco");
    const userOrganizations = await prisma.userOrganization.findMany({
      where: { userId: usuarioId, isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    let primaryRole = "member";
    let primaryOrganizationId = null;
    if (userOrganizations.length > 0) {
      const rolePriority = {
        owner: 6,
        admin: 5,
        professional: 4,
        attendant: 3,
        patient: 2,
        member: 1
      };
      let highestPriority = 0;
      for (const userOrg of userOrganizations) {
        const priority = rolePriority[userOrg.role] || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          primaryRole = userOrg.role;
          primaryOrganizationId = userOrg.organizationId;
        }
      }
    }
    const organizations = userOrganizations.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.name,
      role: uo.role
    }));
    return {
      ...serializeUser(usuarioAtualizado),
      primaryRole,
      primaryOrganizationId,
      organizations
    };
  } catch (err) {
    console.error("Erro na fun\xE7\xE3o updateUser:", err);
    console.error("C\xF3digo do erro:", err.code);
    console.error("Mensagem do erro:", err.message);
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
var prisma2 = new import_client2.PrismaClient();
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
    console.log("userType recebido:", parseResult.userType);
    console.log("organizationId recebido:", parseResult.organizationId);
    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });
    const createUsuario2 = await createUser(parseResult);
    const token = request.server.jwt.sign(
      { userId: createUsuario2.id },
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
  try {
    console.log("=== CREATE USER ADMIN ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);
    const admin = await getUsuarioLogadoIsAdmin(request);
    console.log("Admin logado:", admin.id);
    console.log("Admin primaryOrganizationId:", admin.primaryOrganizationId);
    console.log("Admin primaryRole:", admin.primaryRole);
    console.log("Admin organizations:", admin.organizations);
    const parseResult = request.body;
    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
    console.log("userType recebido:", parseResult.userType);
    console.log("organizationId recebido:", parseResult.organizationId);
    console.log("Validando email e CPF...");
    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });
    console.log("Email e CPF v\xE1lidos");
    const createUsuario2 = await createUserAdmin(parseResult);
    console.log("Usu\xE1rio criado:", createUsuario2.id);
    let targetOrganizationId = parseResult.organizationId;
    let userRole = parseResult.userType || "patient";
    if (!targetOrganizationId) {
      targetOrganizationId = admin.primaryOrganizationId;
      console.log(
        "Usando organiza\xE7\xE3o prim\xE1ria do admin:",
        targetOrganizationId
      );
    }
    if (!targetOrganizationId) {
      console.log("Nenhuma organiza\xE7\xE3o dispon\xEDvel para vincular o usu\xE1rio");
      console.log("Admin n\xE3o tem organiza\xE7\xE3o prim\xE1ria definida");
    } else {
      console.log("Adicionando usu\xE1rio \xE0 organiza\xE7\xE3o:", targetOrganizationId);
      let role;
      switch (userRole) {
        case "patient":
          role = "patient";
          break;
        case "professional":
          role = "professional";
          break;
        case "parent":
          role = "patient";
          break;
        default:
          role = "patient";
      }
      console.log("Role determinado:", role);
      await prisma2.userOrganization.create({
        data: {
          userId: createUsuario2.id,
          organizationId: targetOrganizationId,
          role
        }
      });
      console.log("Usu\xE1rio adicionado \xE0 organiza\xE7\xE3o com sucesso");
    }
    const token = request.server.jwt.sign(
      { userId: createUsuario2.id },
      { expiresIn: "7d" }
    );
    console.log("Token gerado com sucesso");
    return reply.status(200).send({
      status: "success",
      data: { token, usuario: createUsuario2 }
    });
  } catch (error) {
    console.error("Erro em createUsuarioAdmin:", error);
    if (error instanceof Error) {
      return reply.status(400).send({
        status: "error",
        message: error.message
      });
    }
    return reply.status(500).send({
      status: "error",
      message: "Internal server error"
    });
  }
}
async function updateUsuario(request, reply) {
  try {
    console.log("=== UPDATE USER ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);
    const usuario = await getUsuarioLogado(request);
    console.log("Usu\xE1rio logado:", usuario.id);
    const parseResult = request.body;
    console.log(
      "Dados para atualiza\xE7\xE3o:",
      JSON.stringify(parseResult, null, 2)
    );
    const updateUsuario2 = await updateUser(usuario.id, parseResult);
    console.log("Usu\xE1rio atualizado com sucesso");
    return reply.code(200).send({
      status: "success",
      data: updateUsuario2
    });
  } catch (error) {
    console.error("Erro ao atualizar usu\xE1rio:", error);
    if (error instanceof Error) {
      return reply.status(500).send({
        status: "error",
        message: error.message
      });
    }
    return reply.status(500).send({
      status: "error",
      message: "Internal server error"
    });
  }
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

// src/tests/utils/testHelpers.ts
async function createTestApp() {
  const app = (0, import_fastify.default)({ logger: false });
  await app.register(import_jwt.default, {
    secret: process.env.JWT_SECRET || "test-secret-key"
  });
  app.get("/user", { preHandler: [authenticateToken] }, getUsuario);
  app.post("/user/login", loginUsuario);
  app.post("/user", createUsuario);
  app.post(
    "/user/admin",
    { preHandler: [authenticateToken] },
    createUsuarioAdmin
  );
  app.put("/user", { preHandler: [authenticateToken] }, updateUsuario);
  app.delete("/user/:id", { preHandler: [authenticateToken] }, deleteUsuario);
  return app;
}
async function authenticateToken(request, reply) {
  try {
    await request.jwtVerify();
    const { userId, register } = request.user;
    request.usuario = {
      id: userId,
      register
    };
  } catch (err) {
    reply.code(401).send({ status: "error", message: "Unauthorized" });
  }
}
async function createTestUser(data) {
  const hashedPassword = await import_bcrypt2.default.hash(data.password, 10);
  return await prisma.users.create({
    data: {
      email: data.email,
      password: hashedPassword,
      cpf: data.cpf,
      register: data.register || "patient",
      name: data.name || "Test User"
    }
  });
}
async function generateToken(app, userId, register) {
  return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}
async function cleanDatabase() {
  await prisma.users.deleteMany();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanDatabase,
  createTestApp,
  createTestUser,
  generateToken
});
