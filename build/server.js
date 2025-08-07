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
var import_zod = require("zod");

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
  if (error instanceof import_zod.ZodError) {
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

// src/controllers/usuarioController.ts
var import_client2 = require("@prisma/client");

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
  const token = await fastify2.jwt.sign(
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
var getUsuarioLogadoIsAdminOrAttendant = async (request) => {
  const { id: usuarioId, primaryRole } = request.usuario;
  const allowedRoles = ["professional", "admin", "owner", "attendant"];
  if (!allowedRoles.includes(primaryRole)) {
    throw new Unauthorized("User is not authorized");
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
  return serializeUser(user);
}
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
async function getAllUsers() {
  try {
    const users = await prisma.users.findMany({
      select: selectUsuario,
      orderBy: [{ name: "asc" }]
    });
    const usersWithOrganizations = await Promise.all(
      users.map(async (user) => {
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
        return {
          ...serializeUser(user),
          primaryRole,
          primaryOrganizationId,
          organizations: userOrganizations.map((uo) => ({
            id: uo.organization.id,
            name: uo.organization.name,
            role: uo.role
          }))
        };
      })
    );
    return usersWithOrganizations;
  } catch (error) {
    console.error("Erro em getAllUsers:", error);
    throw error;
  }
}
async function updateUserByProfessional(targetUserId, data) {
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
    return serializeUser(usuarioAtualizado);
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
async function addUserToOrganization(userId, organizationId2, role) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId2 },
    select: { id: true }
  });
  if (!organization) {
    throw new NotFound("Organization not found");
  }
  const existingAssociation = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId: organizationId2,
      isActive: true
    }
  });
  if (existingAssociation) {
    throw new BadRequest("User is already associated with this organization");
  }
  const userOrganization = await prisma.userOrganization.create({
    data: {
      userId,
      organizationId: organizationId2,
      role,
      isActive: true
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return userOrganization;
}
async function getUsersFromCurrentOrganization(organizationId2) {
  try {
    const users = await prisma.users.findMany({
      where: {
        userOrganizations: {
          some: {
            organizationId: organizationId2,
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        birthDate: true,
        address: true,
        numberOfAddress: true,
        complement: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        userOrganizations: {
          where: {
            organizationId: organizationId2,
            isActive: true
          },
          select: {
            role: true,
            joinedAt: true,
            isActive: true
          }
        }
      }
    });
    return users.map((user) => {
      const userOrg = user.userOrganizations[0];
      return {
        ...user,
        primaryRole: userOrg?.role || null,
        primaryOrganizationId: organizationId2,
        organizations: userOrg ? [
          {
            id: organizationId2,
            role: userOrg.role,
            joinedAt: userOrg.joinedAt,
            isActive: userOrg.isActive
          }
        ] : []
      };
    });
  } catch (error) {
    console.error("Erro em getUsersFromCurrentOrganization:", error);
    throw error;
  }
}
async function removeUserFromOrganization(userId, organizationId2) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId2 },
    select: { id: true }
  });
  if (!organization) {
    throw new NotFound("Organization not found");
  }
  const existingAssociation = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId: organizationId2,
      isActive: true
    }
  });
  if (!existingAssociation) {
    throw new BadRequest("User is not associated with this organization");
  }
  const userOrganization = await prisma.userOrganization.update({
    where: {
      id: existingAssociation.id
    },
    data: {
      isActive: false
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return userOrganization;
}
async function getAllUsersFromSystem() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        birthDate: true,
        address: true,
        numberOfAddress: true,
        complement: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        userOrganizations: {
          where: {
            isActive: true
          },
          select: {
            role: true,
            organizationId: true,
            joinedAt: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return users.map((user) => {
      const primaryOrg = user.userOrganizations[0];
      return {
        ...user,
        primaryRole: primaryOrg?.role || null,
        primaryOrganizationId: primaryOrg?.organizationId || null,
        organizations: user.userOrganizations.map((org) => ({
          id: org.organizationId,
          name: org.organization.name,
          role: org.role,
          joinedAt: org.joinedAt
        }))
      };
    });
  } catch (error) {
    console.error("Erro em getAllUsersFromSystem:", error);
    throw error;
  }
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
async function getProfessionals(request, reply) {
  const professionals = await getAllProfessionals();
  return reply.status(200).send({
    status: "success",
    data: professionals
  });
}
async function getAllUsuarios(request, reply) {
  try {
    await getUsuarioLogadoIsAdminOrAttendant(request);
    const users = await getAllUsers();
    return reply.status(200).send({
      status: "success",
      data: users
    });
  } catch (error) {
    console.error("Erro em getAllUsuarios:", error);
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
  const updateUsuario2 = await updateUserByProfessional(id, parseResult);
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
async function addUserToOrganizationController(request, reply) {
  try {
    await getUsuarioLogadoIsAdmin(request);
    const { userId, organizationId: organizationId2, role } = request.body;
    let finalRole;
    switch (role) {
      case "patient":
        finalRole = "patient";
        break;
      case "professional":
        finalRole = "professional";
        break;
      case "parent":
        finalRole = "patient";
        break;
      default:
        finalRole = "patient";
    }
    const userOrganization = await addUserToOrganization(
      userId,
      organizationId2,
      finalRole
    );
    return reply.status(200).send({
      status: "success",
      data: userOrganization
    });
  } catch (error) {
    console.error("Erro ao adicionar usu\xE1rio \xE0 organiza\xE7\xE3o:", error);
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
async function getUserOrganizationsController(request, reply) {
  try {
    const loggedUser = await getUsuarioLogado(request);
    const { userId } = request.params;
    if (loggedUser.id !== userId) {
      return reply.status(403).send({
        status: "error",
        message: "Acesso negado. Voc\xEA s\xF3 pode ver suas pr\xF3prias organiza\xE7\xF5es."
      });
    }
    const userOrganizations = await prisma2.userOrganization.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    const formattedOrganizations = userOrganizations.map((uo) => ({
      id: uo.id,
      userId: uo.userId,
      organizationId: uo.organizationId,
      role: uo.role,
      isActive: uo.isActive,
      joinedAt: uo.joinedAt.toISOString(),
      createdAt: uo.createdAt.toISOString(),
      updatedAt: uo.updatedAt.toISOString(),
      organization: {
        id: uo.organization.id,
        name: uo.organization.name,
        description: uo.organization.description
      }
    }));
    return reply.status(200).send({
      status: "success",
      data: formattedOrganizations
    });
  } catch (error) {
    console.error("Erro em getUserOrganizationsController:", error);
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
async function getUsersFromCurrentOrganizationController(request, reply) {
  try {
    await getUsuarioLogadoIsAdmin(request);
    const user = await getUsuarioLogado(request);
    const userOrganization = await prisma2.userOrganization.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        organizationId: true
      }
    });
    if (!userOrganization?.organizationId) {
      return reply.status(400).send({
        status: "error",
        message: "Usu\xE1rio n\xE3o est\xE1 associado a nenhuma organiza\xE7\xE3o"
      });
    }
    const users = await getUsersFromCurrentOrganization(
      userOrganization.organizationId
    );
    return reply.status(200).send({
      status: "success",
      data: users
    });
  } catch (error) {
    console.error("Erro em getUsersFromCurrentOrganizationController:", error);
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
async function removeUserFromOrganizationController(request, reply) {
  try {
    await getUsuarioLogadoIsAdmin(request);
    const { userId } = request.params;
    const user = await getUsuarioLogado(request);
    const userOrganization = await prisma2.userOrganization.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        organizationId: true
      }
    });
    if (!userOrganization?.organizationId) {
      return reply.status(400).send({
        status: "error",
        message: "Usu\xE1rio n\xE3o est\xE1 associado a nenhuma organiza\xE7\xE3o"
      });
    }
    const userOrganizationResult = await removeUserFromOrganization(
      userId,
      userOrganization.organizationId
    );
    return reply.status(200).send({
      status: "success",
      data: userOrganizationResult
    });
  } catch (error) {
    console.error("Erro em removeUserFromOrganizationController:", error);
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
async function getAllUsersFromSystemController(request, reply) {
  try {
    const user = await getUsuarioLogado(request);
    const allowedRoles = ["owner", "admin", "member"];
    if (!user.primaryRole || !allowedRoles.includes(user.primaryRole)) {
      return reply.status(403).send({
        status: "error",
        message: "Acesso negado. Apenas propriet\xE1rios, administradores e membros podem visualizar todos os usu\xE1rios."
      });
    }
    const users = await getAllUsersFromSystem();
    return reply.status(200).send({
      status: "success",
      data: users
    });
  } catch (error) {
    console.error("Erro em getAllUsersFromSystemController:", error);
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
async function checkEmailAvailability(request, reply) {
  try {
    const { email } = request.params;
    console.log("=== CHECK EMAIL AVAILABILITY ===");
    console.log("Email:", email);
    const existingUser = await prisma2.users.findUnique({
      where: { email },
      select: { id: true, email: true }
    });
    const isAvailable = !existingUser;
    console.log("Email dispon\xEDvel:", isAvailable);
    return reply.status(200).send({
      status: "success",
      data: {
        email,
        isAvailable,
        message: isAvailable ? "Email dispon\xEDvel" : "Email j\xE1 est\xE1 em uso"
      }
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do email:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro ao verificar disponibilidade do email"
    });
  }
}
async function checkCpfAvailability(request, reply) {
  try {
    const { cpf } = request.params;
    console.log("=== CHECK CPF AVAILABILITY ===");
    console.log("CPF:", cpf);
    const existingUser = await prisma2.users.findUnique({
      where: { cpf },
      select: { id: true, cpf: true }
    });
    const isAvailable = !existingUser;
    console.log("CPF dispon\xEDvel:", isAvailable);
    return reply.status(200).send({
      status: "success",
      data: {
        cpf,
        isAvailable,
        message: isAvailable ? "CPF dispon\xEDvel" : "CPF j\xE1 est\xE1 em uso"
      }
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do CPF:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro ao verificar disponibilidade do CPF"
    });
  }
}

// src/docs/usuario.ts
var import_zod4 = require("zod");

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
var import_zod2 = require("zod");
var headersSchema = import_zod2.z.object({
  authorization: import_zod2.z.string()
});

// src/types/usuario.ts
var import_zod3 = require("zod");
var schemaRegister = import_zod3.z.enum([
  "patient",
  "parents",
  "professional",
  "attendant"
]);
var schemaUsuario = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod3.z.string().email("Email inv\xE1lido"),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaUsuarioUpdate = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod3.z.string().email("Email inv\xE1lido").optional(),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaPatientCID = import_zod3.z.object({
  patientId: import_zod3.z.string().min(1, "ID do paciente \xE9 obrigat\xF3rio"),
  professionalId: import_zod3.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  organizationId: import_zod3.z.string().min(1, "ID da organiza\xE7\xE3o \xE9 obrigat\xF3rio"),
  cid: import_zod3.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod3.z.string().optional()
});
var schemaPatientCIDUpdate = import_zod3.z.object({
  cid: import_zod3.z.string().min(1, "CID \xE9 obrigat\xF3rio"),
  description: import_zod3.z.string().optional()
});
var schemaUsuarioCreate = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod3.z.string().email("Email inv\xE1lido"),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaUsuarioCreateAdmin = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod3.z.string().email("Email inv\xE1lido"),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaUsuarioUpdateAdmin = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod3.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaUsuarioCreateByProfessional = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  email: import_zod3.z.string().email("Email inv\xE1lido"),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var schemaUsuarioUpdateByProfessional = import_zod3.z.object({
  name: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  email: import_zod3.z.string().email("Email inv\xE1lido").optional(),
  password: import_zod3.z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  cpf: import_zod3.z.string().min(11, "CPF deve ter pelo menos 11 caracteres").optional(),
  phone: import_zod3.z.string().optional(),
  birthDate: import_zod3.z.string().optional(),
  address: import_zod3.z.string().optional(),
  numberOfAddress: import_zod3.z.string().optional(),
  complement: import_zod3.z.string().optional(),
  city: import_zod3.z.string().optional(),
  state: import_zod3.z.string().optional(),
  zipCode: import_zod3.z.string().optional(),
  country: import_zod3.z.string().optional(),
  image: import_zod3.z.string().optional()
});
var editUsuarioSchema = schemaUsuarioUpdate;
var editUsuarioByAdminSchema = schemaUsuarioUpdateByProfessional;
var requestUsuarioSchema = schemaUsuarioCreate;
var responseProfessionalSchema = import_zod3.z.object({
  id: import_zod3.z.string(),
  name: import_zod3.z.string(),
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
  image: import_zod3.z.string().nullable(),
  primaryRole: import_zod3.z.string(),
  primaryOrganizationId: import_zod3.z.string().nullable(),
  organizations: import_zod3.z.array(
    import_zod3.z.object({
      id: import_zod3.z.string(),
      name: import_zod3.z.string(),
      role: import_zod3.z.string()
    })
  ),
  createdAt: import_zod3.z.string(),
  updatedAt: import_zod3.z.string()
});
var responseUsuarioLoginSchema = import_zod3.z.object({
  token: import_zod3.z.string(),
  usuario: responseProfessionalSchema
});
var responseUsuarioSchema = responseProfessionalSchema;

// src/docs/usuario.ts
var errorResponseSchema = import_zod4.z.object({
  status: import_zod4.z.literal("error"),
  message: import_zod4.z.string()
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.array(responseProfessionalSchema)
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.array(responseUsuarioSchema)
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
    params: import_zod4.z.object({
      id: import_zod4.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
    params: import_zod4.z.object({
      id: import_zod4.z.string().describe("ID do usu\xE1rio a ser atualizado")
    }),
    body: editUsuarioByAdminSchema,
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
    body: import_zod4.z.object({
      email: import_zod4.z.string().transform((value) => value.toLowerCase()),
      password: import_zod4.z.string()
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
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
    params: import_zod4.z.object({
      id: import_zod4.z.string().describe("ID do usu\xE1rio a ser deletado")
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.object({
          message: import_zod4.z.string()
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
    body: import_zod4.z.object({
      userId: import_zod4.z.string().describe("ID do usu\xE1rio"),
      organizationId: import_zod4.z.string().describe("ID da organiza\xE7\xE3o"),
      role: import_zod4.z.enum([
        "owner",
        "admin",
        "professional",
        "attendant",
        "patient",
        "member"
      ]).describe("Papel do usu\xE1rio na organiza\xE7\xE3o")
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.object({
          id: import_zod4.z.string(),
          userId: import_zod4.z.string(),
          organizationId: import_zod4.z.string(),
          role: import_zod4.z.string(),
          isActive: import_zod4.z.boolean(),
          joinedAt: import_zod4.z.string(),
          createdAt: import_zod4.z.string(),
          updatedAt: import_zod4.z.string(),
          organization: import_zod4.z.object({
            id: import_zod4.z.string(),
            name: import_zod4.z.string()
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
    params: import_zod4.z.object({
      userId: import_zod4.z.string().describe("ID do usu\xE1rio")
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.array(
          import_zod4.z.object({
            id: import_zod4.z.string(),
            userId: import_zod4.z.string(),
            organizationId: import_zod4.z.string(),
            role: import_zod4.z.string(),
            isActive: import_zod4.z.boolean(),
            joinedAt: import_zod4.z.string(),
            createdAt: import_zod4.z.string(),
            updatedAt: import_zod4.z.string(),
            organization: import_zod4.z.object({
              id: import_zod4.z.string(),
              name: import_zod4.z.string(),
              description: import_zod4.z.string().nullable()
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.array(
          import_zod4.z.object({
            id: import_zod4.z.string(),
            name: import_zod4.z.string().nullable(),
            email: import_zod4.z.string(),
            cpf: import_zod4.z.string(),
            phone: import_zod4.z.string().nullable(),
            birthDate: import_zod4.z.string().nullable(),
            address: import_zod4.z.string().nullable(),
            numberOfAddress: import_zod4.z.string().nullable(),
            complement: import_zod4.z.string().nullable(),
            city: import_zod4.z.string().nullable(),
            state: import_zod4.z.string().nullable(),
            zipCode: import_zod4.z.string().nullable(),
            country: import_zod4.z.string().nullable(),
            createdAt: import_zod4.z.string(),
            updatedAt: import_zod4.z.string(),
            primaryRole: import_zod4.z.string().nullable(),
            primaryOrganizationId: import_zod4.z.string().nullable(),
            organizations: import_zod4.z.array(
              import_zod4.z.object({
                id: import_zod4.z.string(),
                role: import_zod4.z.string(),
                joinedAt: import_zod4.z.string(),
                isActive: import_zod4.z.boolean()
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
    params: import_zod4.z.object({
      userId: import_zod4.z.string().describe("ID do usu\xE1rio a ser removido")
    }),
    response: {
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.object({
          id: import_zod4.z.string(),
          userId: import_zod4.z.string(),
          organizationId: import_zod4.z.string(),
          role: import_zod4.z.string(),
          isActive: import_zod4.z.boolean(),
          joinedAt: import_zod4.z.string(),
          createdAt: import_zod4.z.string(),
          updatedAt: import_zod4.z.string(),
          organization: import_zod4.z.object({
            id: import_zod4.z.string(),
            name: import_zod4.z.string()
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
      200: import_zod4.z.object({
        status: import_zod4.z.literal("success"),
        data: import_zod4.z.array(
          import_zod4.z.object({
            id: import_zod4.z.string(),
            name: import_zod4.z.string().nullable(),
            email: import_zod4.z.string(),
            cpf: import_zod4.z.string(),
            phone: import_zod4.z.string().nullable(),
            birthDate: import_zod4.z.string().nullable(),
            address: import_zod4.z.string().nullable(),
            numberOfAddress: import_zod4.z.string().nullable(),
            complement: import_zod4.z.string().nullable(),
            city: import_zod4.z.string().nullable(),
            state: import_zod4.z.string().nullable(),
            zipCode: import_zod4.z.string().nullable(),
            country: import_zod4.z.string().nullable(),
            createdAt: import_zod4.z.string(),
            updatedAt: import_zod4.z.string(),
            primaryRole: import_zod4.z.string().nullable(),
            primaryOrganizationId: import_zod4.z.string().nullable(),
            organizations: import_zod4.z.array(
              import_zod4.z.object({
                id: import_zod4.z.string(),
                name: import_zod4.z.string(),
                role: import_zod4.z.string(),
                joinedAt: import_zod4.z.string()
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

// src/routes/user/usuarioRoutes.ts
async function usuarioRoutes(app2) {
  app2.withTypeProvider().get("/user", usuarioDocs.getUsuario, getUsuario);
  app2.withTypeProvider().get("/professionals", usuarioDocs.getProfessionals, getProfessionals);
  app2.withTypeProvider().get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);
  app2.withTypeProvider().get("/users/:id", usuarioDocs.getUsuarioById, getUsuarioById);
  app2.withTypeProvider().post("/user/login", usuarioDocs.loginUsuario, loginUsuario);
  app2.withTypeProvider().post("/user", usuarioDocs.postUsuario, createUsuario);
  app2.withTypeProvider().post("/user/admin", usuarioDocs.postUsuarioAdmin, createUsuarioAdmin);
  app2.withTypeProvider().put("/user", usuarioDocs.putUsuario, updateUsuario);
  app2.withTypeProvider().put("/user/:id", usuarioDocs.putUsuarioByDoctor, updateUsuarioByDoctor);
  app2.withTypeProvider().delete("/user/:id", usuarioDocs.deleteUsuario, deleteUsuario);
  app2.withTypeProvider().post(
    "/user/organization",
    usuarioDocs.addUserToOrganization,
    addUserToOrganizationController
  );
  app2.withTypeProvider().get(
    "/user/:userId/organizations",
    usuarioDocs.getUserOrganizations,
    getUserOrganizationsController
  );
  app2.withTypeProvider().get(
    "/user/organization/current",
    usuarioDocs.getUsersFromCurrentOrganization,
    getUsersFromCurrentOrganizationController
  );
  app2.withTypeProvider().delete(
    "/user/organization/:userId",
    usuarioDocs.removeUserFromOrganization,
    removeUserFromOrganizationController
  );
  app2.withTypeProvider().get(
    "/user/system/all",
    usuarioDocs.getAllUsersFromSystem,
    getAllUsersFromSystemController
  );
  app2.withTypeProvider().get("/user/check-email/:email", checkEmailAvailability);
  app2.withTypeProvider().get("/user/check-cpf/:cpf", checkCpfAvailability);
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
    message: `Seu agendamento com ${appointment.professional.name} foi confirmado para ${date} \xE0s ${time}`
  });
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
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
    message: `Seu agendamento com ${appointment.professional.name} para ${date} \xE0s ${time} foi cancelado`
  });
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
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
  professionalId: true,
  organizationId: true,
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
  professional: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  organization: {
    select: {
      id: true,
      name: true
    }
  }
};
async function checkSlotAvailability(professionalId, organizationId2, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone3.default)(startTime).add(3, "hours").toDate();
  const localEndTime = (0, import_moment_timezone3.default)(endTime).add(3, "hours").toDate();
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE: ${(0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone3.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = (0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
      organizationId: organizationId2,
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
  const requestedStart = (0, import_moment_timezone3.default)(localStartTime).tz(TIMEZONE2);
  const requestedEnd = (0, import_moment_timezone3.default)(localEndTime).tz(TIMEZONE2);
  if (requestedStart.isBefore(availabilityStart) || requestedEnd.isAfter(availabilityEnd)) {
    throw new BadRequest(
      "Hor\xE1rio solicitado est\xE1 fora do per\xEDodo de disponibilidade do m\xE9dico"
    );
  }
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      professionalId,
      organizationId: organizationId2,
      startTime: {
        lt: localEndTime
      },
      endTime: {
        gt: localStartTime
      },
      status: {
        in: ["scheduled", "confirmed"]
      }
    }
  });
  if (existingAppointment) {
    throw new BadRequest("J\xE1 existe um agendamento neste hor\xE1rio");
  }
  return true;
}
async function generateAvailableSlots(professionalId, date) {
  console.log(`
=== INICIANDO GERA\xC7\xC3O DE SLOTS ===`);
  console.log(`Data solicitada: ${date}`);
  console.log(`Profissional ID: ${professionalId}`);
  const requestedDate = (0, import_moment_timezone3.default)(date).tz(TIMEZONE2);
  const dayOfWeek = requestedDate.day();
  console.log(`Dia da semana: ${dayOfWeek} (${requestedDate.format("dddd")})`);
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
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
      professionalId,
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
  console.log(`Profissional ID: ${professionalId}`);
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
  const {
    patientId,
    professionalId,
    organizationId: organizationId2,
    startTime,
    endTime,
    notes
  } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const professionalIdString = typeof professionalId === "string" ? professionalId : professionalId.id;
  const organizationIdString = typeof organizationId2 === "string" ? organizationId2 : organizationId2.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const professional = await prisma.users.findUnique({
    where: { id: professionalIdString }
  });
  if (!professional) {
    throw new Error("Profissional n\xE3o encontrado");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationIdString }
  });
  if (!organization) {
    throw new Error("Organiza\xE7\xE3o n\xE3o encontrada");
  }
  await checkSlotAvailability(
    professionalIdString,
    organizationIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const canSchedule = await canPatientScheduleWithProfessional(
    patientIdString,
    professionalIdString,
    new Date(startTime)
  );
  if (!canSchedule.canSchedule) {
    throw new BadRequest(
      canSchedule.reason || "N\xE3o \xE9 poss\xEDvel agendar este hor\xE1rio"
    );
  }
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      professionalId: professionalIdString,
      organizationId: organizationIdString,
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
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
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
  const {
    patientId,
    professionalId,
    organizationId: organizationId2,
    startTime,
    endTime,
    notes
  } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const professionalIdString = typeof professionalId === "string" ? professionalId : professionalId.id;
  const organizationIdString = typeof organizationId2 === "string" ? organizationId2 : organizationId2.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const professional = await prisma.users.findUnique({
    where: { id: professionalIdString }
  });
  if (!professional) {
    throw new Error("Profissional n\xE3o encontrado");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationIdString }
  });
  if (!organization) {
    throw new Error("Organiza\xE7\xE3o n\xE3o encontrada");
  }
  await checkSlotAvailabilityForAttendant(
    professionalIdString,
    organizationIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const canSchedule = await canPatientScheduleWithProfessional(
    patientIdString,
    professionalIdString,
    new Date(startTime)
  );
  if (!canSchedule.canSchedule) {
    throw new BadRequest(
      canSchedule.reason || "N\xE3o \xE9 poss\xEDvel agendar este hor\xE1rio"
    );
  }
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      professionalId: professionalIdString,
      organizationId: organizationIdString,
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
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
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
async function checkSlotAvailabilityForAttendant(professionalId, organizationId2, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone3.default)(startTime).add(3, "hours");
  const localEndTime = (0, import_moment_timezone3.default)(endTime).add(3, "hours");
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE (ATTENDANT): ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = localStartTime.tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
      organizationId: organizationId2,
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
      professionalId,
      organizationId: organizationId2,
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
var canPatientScheduleWithProfessional = async (patientId, professionalId, requestedDate) => {
  try {
    if (requestedDate) {
      const startOfDay = (0, import_moment_timezone3.default)(requestedDate).startOf("day").toDate();
      const endOfDay = (0, import_moment_timezone3.default)(requestedDate).endOf("day").toDate();
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          professionalId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ["scheduled", "confirmed"]
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          professional: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      if (existingAppointment) {
        return {
          canSchedule: false,
          reason: `Voc\xEA j\xE1 possui um agendamento com ${existingAppointment.professional.name} no dia ${(0, import_moment_timezone3.default)(existingAppointment.startTime).format(
            "DD/MM/YYYY"
          )} \xE0s ${(0, import_moment_timezone3.default)(existingAppointment.startTime).format("HH:mm")}`,
          existingAppointment
        };
      }
    }
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
async function getPatientAppointments(patientId, organizationId2, status) {
  const whereClause = {
    patientId
  };
  if (organizationId2) {
    whereClause.organizationId = organizationId2;
  }
  if (status) {
    whereClause.status = status;
  }
  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: selectAppointmentWithUsers,
    orderBy: { startTime: "desc" }
  });
  return adjustAppointmentTimes(appointments);
}
async function getProfessionalAppointments(professionalId, organizationId2, startDate, endDate) {
  const whereClause = {
    professionalId
  };
  if (organizationId2) {
    whereClause.organizationId = organizationId2;
  }
  if (startDate && endDate) {
    whereClause.startTime = {
      gte: startDate,
      lte: endDate
    };
  }
  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: selectAppointmentWithUsers,
    orderBy: { startTime: "asc" }
  });
  return adjustAppointmentTimes(appointments);
}
async function updateAppointmentStatus(appointmentId, status, userId, userRole) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      professional: true
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
  if (userRole === "professional" && appointment.professionalId !== userId) {
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
async function createProfessionalAvailability(professionalId, organizationId2, availability) {
  const existingAvailability = await prisma.availability.findUnique({
    where: {
      professionalId_organizationId_dayOfWeek_startTime: {
        professionalId,
        organizationId: organizationId2,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime
      }
    }
  });
  if (existingAvailability) {
    throw new BadRequest(
      "J\xE1 existe disponibilidade configurada para este hor\xE1rio"
    );
  }
  const newAvailability = await prisma.availability.create({
    data: {
      professionalId,
      organizationId: organizationId2,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isActive: true
    }
  });
  return newAvailability;
}
async function getProfessionalAvailability(professionalId, organizationId2) {
  const whereClause = { professionalId };
  if (organizationId2) {
    whereClause.organizationId = organizationId2;
  }
  const availabilities = await prisma.availability.findMany({
    where: whereClause,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return availabilities;
}
async function deleteProfessionalAvailability(availabilityId, professionalId) {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId,
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
      professionalId,
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
      professional: true
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
    appointments = await getProfessionalAppointments(
      userId,
      void 0,
      start,
      end
    );
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
    const created = await createProfessionalAvailability(
      doctorId,
      organizationId,
      availability
    );
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
  const availabilities = await getProfessionalAvailability(doctorId);
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
  const appointments = await getProfessionalAppointments(
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
    const result = await deleteProfessionalAvailability(
      availabilityId,
      doctorId
    );
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
    const availability = await canPatientScheduleWithProfessional(
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
var import_zod6 = require("zod");

// src/types/appointment.ts
var import_zod5 = require("zod");
var appointmentStatusEnum = import_zod5.z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);
var responseAppointmentSchemaProps = {
  id: import_zod5.z.string(),
  patientId: import_zod5.z.string(),
  professionalId: import_zod5.z.string(),
  startTime: import_zod5.z.string(),
  endTime: import_zod5.z.string(),
  status: appointmentStatusEnum,
  notes: import_zod5.z.string().nullish(),
  googleEventId: import_zod5.z.string().nullish(),
  createdAt: import_zod5.z.string(),
  updatedAt: import_zod5.z.string()
};
var responseAppointmentSchema = import_zod5.z.object(
  responseAppointmentSchemaProps
);
var responseAppointmentWithUsersSchema = responseAppointmentSchema.extend({
  patient: import_zod5.z.object({
    id: import_zod5.z.string(),
    name: import_zod5.z.string().nullish(),
    email: import_zod5.z.string(),
    phone: import_zod5.z.string().nullish()
  }),
  professional: import_zod5.z.object({
    id: import_zod5.z.string(),
    name: import_zod5.z.string().nullish(),
    email: import_zod5.z.string(),
    phone: import_zod5.z.string().nullish()
  })
});
var createAppointmentSchema = import_zod5.z.object({
  professionalId: import_zod5.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  startTime: import_zod5.z.string(),
  notes: import_zod5.z.string().optional()
});
var updateAppointmentSchema = import_zod5.z.object({
  startTime: import_zod5.z.string().optional(),
  status: appointmentStatusEnum.optional(),
  notes: import_zod5.z.string().optional()
});
var getAvailableSlotsSchema = import_zod5.z.object({
  professionalId: import_zod5.z.string().min(1, "ID do profissional \xE9 obrigat\xF3rio"),
  date: import_zod5.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});
var availabilitySchema = import_zod5.z.object({
  dayOfWeek: import_zod5.z.number().min(0).max(6),
  startTime: import_zod5.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  endTime: import_zod5.z.string().regex(/^\d{2}:\d{2}$/, "Hor\xE1rio deve estar no formato HH:mm"),
  isActive: import_zod5.z.boolean().optional()
});
var responseAvailabilitySchema = availabilitySchema.extend({
  id: import_zod5.z.string(),
  professionalId: import_zod5.z.string(),
  createdAt: import_zod5.z.string(),
  updatedAt: import_zod5.z.string()
});

// src/docs/appointment.ts
var errorResponseSchema2 = import_zod6.z.object({
  status: import_zod6.z.literal("error"),
  message: import_zod6.z.string()
});
var attendanceSchema = import_zod6.z.object({
  id: import_zod6.z.string(),
  patientId: import_zod6.z.string(),
  doctorId: import_zod6.z.string(),
  description: import_zod6.z.string(),
  date: import_zod6.z.string(),
  createdAt: import_zod6.z.string(),
  updatedAt: import_zod6.z.string(),
  patient: import_zod6.z.object({
    id: import_zod6.z.string(),
    name: import_zod6.z.string().nullish(),
    email: import_zod6.z.string(),
    phone: import_zod6.z.string().nullish()
  }).optional(),
  doctor: import_zod6.z.object({
    id: import_zod6.z.string(),
    name: import_zod6.z.string().nullish(),
    email: import_zod6.z.string(),
    phone: import_zod6.z.string().nullish()
  }).optional()
});
var createAttendanceSchema = import_zod6.z.object({
  patientId: import_zod6.z.string(),
  description: import_zod6.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_zod6.z.string().optional()
  // pode ser preenchido automaticamente
});
var createAppointmentForPatientSchema = import_zod6.z.object({
  patientId: import_zod6.z.string().describe("ID do paciente"),
  doctorId: import_zod6.z.string().describe("ID do m\xE9dico (pode ser o pr\xF3prio m\xE9dico logado)"),
  startTime: import_zod6.z.string().describe("Data e hora de in\xEDcio do agendamento"),
  notes: import_zod6.z.string().optional().describe("Observa\xE7\xF5es sobre o agendamento")
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
      201: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
    querystring: import_zod6.z.object({
      startDate: import_zod6.z.string().describe("Data de in\xEDcio no formato ISO"),
      endDate: import_zod6.z.string().describe("Data de fim no formato ISO"),
      doctorId: import_zod6.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(
          import_zod6.z.object({
            startTime: import_zod6.z.string(),
            endTime: import_zod6.z.string(),
            available: import_zod6.z.boolean()
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
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(
          import_zod6.z.object({
            startTime: import_zod6.z.string(),
            endTime: import_zod6.z.string(),
            available: import_zod6.z.boolean()
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
    querystring: import_zod6.z.object({
      status: appointmentStatusEnum.optional(),
      startDate: import_zod6.z.string().optional(),
      endDate: import_zod6.z.string().optional()
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(responseAppointmentWithUsersSchema)
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
    params: import_zod6.z.object({
      id: import_zod6.z.string().describe("ID do agendamento")
    }),
    body: import_zod6.z.object({
      status: import_zod6.z.enum([
        "scheduled",
        "confirmed",
        "cancelled",
        "completed",
        "no_show"
      ])
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
    params: import_zod6.z.object({
      appointmentId: import_zod6.z.string().describe("ID do agendamento a ser cancelado")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
      201: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
    params: import_zod6.z.object({
      doctorId: import_zod6.z.string().describe("ID do m\xE9dico")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(responseAvailabilitySchema)
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
    params: import_zod6.z.object({
      availabilityId: import_zod6.z.string().describe("ID da disponibilidade a ser deletada")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.object({
          message: import_zod6.z.string()
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
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(responseAppointmentWithUsersSchema)
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
      201: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
    params: import_zod6.z.object({
      userId: import_zod6.z.string().describe("ID do usu\xE1rio")
    }),
    querystring: import_zod6.z.object({
      status: import_zod6.z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional().describe("Filtrar por status do agendamento")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(responseAppointmentWithUsersSchema)
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
    params: import_zod6.z.object({
      patientId: import_zod6.z.string().describe("ID do paciente"),
      doctorId: import_zod6.z.string().describe("ID do profissional")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.object({
          canSchedule: import_zod6.z.boolean(),
          reason: import_zod6.z.string().optional(),
          existingAppointment: import_zod6.z.object({
            id: import_zod6.z.string(),
            startTime: import_zod6.z.string(),
            endTime: import_zod6.z.string(),
            status: import_zod6.z.string(),
            doctor: import_zod6.z.object({
              id: import_zod6.z.string(),
              name: import_zod6.z.string()
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
    params: import_zod6.z.object({
      doctorId: import_zod6.z.string().describe("ID do m\xE9dico"),
      date: import_zod6.z.string().describe("Data no formato YYYY-MM-DD")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(
          import_zod6.z.object({
            time: import_zod6.z.string(),
            available: import_zod6.z.boolean()
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
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        message: import_zod6.z.string()
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
      201: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
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
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(attendanceSchema)
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
    params: import_zod6.z.object({
      id: import_zod6.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_zod6.z.object({
        status: import_zod6.z.literal("success"),
        data: import_zod6.z.array(attendanceSchema)
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
  const { id: professionalId, primaryRole } = request.usuario;
  if (primaryRole !== "professional") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem registrar atendimentos"
    });
  }
  const { patientId, description, date } = request.body;
  const attendance = await prisma.attendance.create({
    data: {
      patientId,
      professionalId,
      description,
      date: date ? new Date(date) : void 0
    },
    include: {
      patient: true,
      professional: true
    }
  });
  return reply.status(201).send({
    status: "success",
    data: attendance
  });
}
async function getMyAttendances(request, reply) {
  const { id: userId, primaryRole } = request.usuario;
  let where = {};
  if (primaryRole === "professional") {
    where = { professionalId: userId };
  } else {
    where = { patientId: userId };
  }
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      patient: true,
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
async function getPatientAttendances(request, reply) {
  const { id: professionalId, primaryRole } = request.usuario;
  if (primaryRole !== "professional") {
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
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}

// src/docs/attendance.ts
var import_zod7 = require("zod");
var errorResponseSchema3 = import_zod7.z.object({
  status: import_zod7.z.literal("error"),
  message: import_zod7.z.string()
});
var attendanceSchema2 = import_zod7.z.object({
  id: import_zod7.z.string(),
  patientId: import_zod7.z.string(),
  doctorId: import_zod7.z.string(),
  description: import_zod7.z.string(),
  date: import_zod7.z.string(),
  createdAt: import_zod7.z.string(),
  updatedAt: import_zod7.z.string(),
  patient: import_zod7.z.object({
    id: import_zod7.z.string(),
    name: import_zod7.z.string().nullish(),
    email: import_zod7.z.string(),
    phone: import_zod7.z.string().nullish()
  }).optional(),
  doctor: import_zod7.z.object({
    id: import_zod7.z.string(),
    name: import_zod7.z.string().nullish(),
    email: import_zod7.z.string(),
    phone: import_zod7.z.string().nullish()
  }).optional()
});
var createAttendanceSchema2 = import_zod7.z.object({
  patientId: import_zod7.z.string(),
  description: import_zod7.z.string().min(1, "Descri\xE7\xE3o obrigat\xF3ria"),
  date: import_zod7.z.string().optional()
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
      201: import_zod7.z.object({
        status: import_zod7.z.literal("success"),
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
      200: import_zod7.z.object({
        status: import_zod7.z.literal("success"),
        data: import_zod7.z.array(attendanceSchema2)
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
    params: import_zod7.z.object({
      id: import_zod7.z.string().describe("ID do paciente")
    }),
    response: {
      200: import_zod7.z.object({
        status: import_zod7.z.literal("success"),
        data: import_zod7.z.array(attendanceSchema2)
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

// src/controllers/organizationController.ts
async function createOrganization(request, reply) {
  try {
    const {
      name,
      description,
      cnpj,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      website
    } = request.body;
    if (!name) {
      throw new BadRequest("Nome da organiza\xE7\xE3o \xE9 obrigat\xF3rio");
    }
    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        cnpj,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        email,
        website
      }
    });
    return reply.status(201).send({
      status: "success",
      data: organization
    });
  } catch (error) {
    console.error("Erro ao criar organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function getOrganizations(request, reply) {
  try {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
    return reply.status(200).send({
      status: "success",
      data: organizations
    });
  } catch (error) {
    console.error("Erro ao buscar organiza\xE7\xF5es:", error);
    throw error;
  }
}
async function getOrganization(request, reply) {
  try {
    const { id } = request.params;
    const organization = await prisma.organization.findUnique({
      where: { id }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    return reply.status(200).send({
      status: "success",
      data: organization
    });
  } catch (error) {
    console.error("Erro ao buscar organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function updateOrganization(request, reply) {
  try {
    const { id } = request.params;
    const updateData = request.body;
    const organization = await prisma.organization.findUnique({
      where: { id }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: updateData
    });
    return reply.status(200).send({
      status: "success",
      data: updatedOrganization
    });
  } catch (error) {
    console.error("Erro ao atualizar organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function deleteOrganization(request, reply) {
  try {
    const { id } = request.params;
    const organization = await prisma.organization.findUnique({
      where: { id }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    await prisma.organization.update({
      where: { id },
      data: { isActive: false }
    });
    return reply.status(200).send({
      status: "success",
      message: "Organiza\xE7\xE3o removida com sucesso"
    });
  } catch (error) {
    console.error("Erro ao remover organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function getUserOrganizations(request, reply) {
  try {
    const { id: userId } = request.usuario;
    const userOrganizations = await prisma.userOrganization.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        organization: true
      },
      orderBy: { createdAt: "asc" }
    });
    return reply.status(200).send({
      status: "success",
      data: userOrganizations
    });
  } catch (error) {
    console.error("Erro ao buscar organiza\xE7\xF5es do usu\xE1rio:", error);
    throw error;
  }
}
async function addUserToOrganization2(request, reply) {
  try {
    const { userId, organizationId: organizationId2, role } = request.body;
    if (!userId || !organizationId2 || !role) {
      throw new BadRequest("userId, organizationId e role s\xE3o obrigat\xF3rios");
    }
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFound("Usu\xE1rio n\xE3o encontrado");
    }
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId2 }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    const existingUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organizationId2
        }
      }
    });
    if (existingUserOrg) {
      throw new BadRequest("Usu\xE1rio j\xE1 est\xE1 associado a esta organiza\xE7\xE3o");
    }
    const userOrganization = await prisma.userOrganization.create({
      data: {
        userId,
        organizationId: organizationId2,
        role
      },
      include: {
        organization: true
      }
    });
    return reply.status(201).send({
      status: "success",
      data: userOrganization
    });
  } catch (error) {
    console.error("Erro ao adicionar usu\xE1rio \xE0 organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function updateUserOrganization(request, reply) {
  try {
    const { id } = request.params;
    const updateData = request.body;
    const userOrganization = await prisma.userOrganization.findUnique({
      where: { id }
    });
    if (!userOrganization) {
      throw new NotFound("Relacionamento usu\xE1rio-organiza\xE7\xE3o n\xE3o encontrado");
    }
    const updatedUserOrg = await prisma.userOrganization.update({
      where: { id },
      data: updateData,
      include: {
        organization: true
      }
    });
    return reply.status(200).send({
      status: "success",
      data: updatedUserOrg
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar relacionamento usu\xE1rio-organiza\xE7\xE3o:",
      error
    );
    throw error;
  }
}
async function removeUserFromOrganization2(request, reply) {
  try {
    const { id } = request.params;
    const userOrganization = await prisma.userOrganization.findUnique({
      where: { id }
    });
    if (!userOrganization) {
      throw new NotFound("Relacionamento usu\xE1rio-organiza\xE7\xE3o n\xE3o encontrado");
    }
    await prisma.userOrganization.update({
      where: { id },
      data: { isActive: false }
    });
    return reply.status(200).send({
      status: "success",
      message: "Usu\xE1rio removido da organiza\xE7\xE3o com sucesso"
    });
  } catch (error) {
    console.error("Erro ao remover usu\xE1rio da organiza\xE7\xE3o:", error);
    throw error;
  }
}
async function getOrganizationUsers(request, reply) {
  try {
    const { organizationId: organizationId2 } = request.params;
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId2 }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    const userOrganizations = await prisma.userOrganization.findMany({
      where: {
        organizationId: organizationId2,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    return reply.status(200).send({
      status: "success",
      data: userOrganizations
    });
  } catch (error) {
    console.error("Erro ao buscar usu\xE1rios da organiza\xE7\xE3o:", error);
    throw error;
  }
}

// src/routes/organization/organizationRoutes.ts
async function organizationRoutes(fastify2) {
  fastify2.get("/organizations", getOrganizations);
  fastify2.get("/organizations/:id", getOrganization);
  fastify2.addHook("preHandler", autenticarToken);
  fastify2.post("/organizations", createOrganization);
  fastify2.put("/organizations/:id", updateOrganization);
  fastify2.delete("/organizations/:id", deleteOrganization);
  fastify2.get("/user/organizations", getUserOrganizations);
  fastify2.post("/user-organizations", addUserToOrganization2);
  fastify2.put("/user-organizations/:id", updateUserOrganization);
  fastify2.delete("/user-organizations/:id", removeUserFromOrganization2);
  fastify2.get("/organizations/:organizationId/users", getOrganizationUsers);
}

// src/service/patientCIDService.service.ts
async function createPatientCID(professionalId, data) {
  const professional = await prisma.users.findUnique({
    where: { id: professionalId },
    include: {
      userOrganizations: {
        where: {
          organizationId: data.organizationId,
          role: { in: ["professional", "admin", "owner"] }
        }
      }
    }
  });
  if (!professional) {
    throw new NotFound("Profissional n\xE3o encontrado");
  }
  if (professional.userOrganizations.length === 0) {
    throw new Unauthorized(
      "Voc\xEA n\xE3o tem permiss\xE3o para criar CIDs nesta organiza\xE7\xE3o"
    );
  }
  const patient = await prisma.users.findUnique({
    where: { id: data.patientId }
  });
  if (!patient) {
    throw new NotFound("Paciente n\xE3o encontrado");
  }
  const existingCID = await prisma.patientCID.findUnique({
    where: {
      patientId_professionalId_organizationId: {
        patientId: data.patientId,
        professionalId,
        organizationId: data.organizationId
      }
    }
  });
  if (existingCID) {
    throw new BadRequest("J\xE1 existe um CID para este paciente criado por voc\xEA");
  }
  const patientCID = await prisma.patientCID.create({
    data: {
      patientId: data.patientId,
      professionalId,
      organizationId: data.organizationId,
      cid: data.cid,
      description: data.description
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      professional: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return patientCID;
}
async function updatePatientCID(professionalId, patientCIDId, data) {
  const patientCID = await prisma.patientCID.findUnique({
    where: { id: patientCIDId },
    include: {
      professional: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!patientCID) {
    throw new NotFound("CID n\xE3o encontrado");
  }
  if (patientCID.professionalId !== professionalId) {
    throw new Unauthorized("Voc\xEA s\xF3 pode editar CIDs criados por voc\xEA");
  }
  const updatedCID = await prisma.patientCID.update({
    where: { id: patientCIDId },
    data: {
      cid: data.cid,
      description: data.description
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      professional: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return updatedCID;
}
async function deletePatientCID(professionalId, patientCIDId) {
  const patientCID = await prisma.patientCID.findUnique({
    where: { id: patientCIDId }
  });
  if (!patientCID) {
    throw new NotFound("CID n\xE3o encontrado");
  }
  if (patientCID.professionalId !== professionalId) {
    throw new Unauthorized("Voc\xEA s\xF3 pode deletar CIDs criados por voc\xEA");
  }
  await prisma.patientCID.delete({
    where: { id: patientCIDId }
  });
  return { message: "CID deletado com sucesso" };
}
async function getPatientCIDs(patientId) {
  const patientCIDs = await prisma.patientCID.findMany({
    where: { patientId },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return patientCIDs;
}
async function getProfessionalCIDs(professionalId) {
  const patientCIDs = await prisma.patientCID.findMany({
    where: { professionalId },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return patientCIDs;
}
async function getPatientCIDById(patientCIDId) {
  const patientCID = await prisma.patientCID.findUnique({
    where: { id: patientCIDId },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      professional: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!patientCID) {
    throw new NotFound("CID n\xE3o encontrado");
  }
  return patientCID;
}

// src/controllers/patientCIDController.ts
async function createPatientCIDController(request, reply) {
  try {
    const professional = await getUsuarioLogado(request);
    const userOrg = professional.userOrganizations.find(
      (org) => org.role === "professional" || org.role === "admin" || org.role === "owner"
    );
    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem criar CIDs"
      });
    }
    const data = request.body;
    const patientCID = await createPatientCID(professional.id, data);
    return reply.status(201).send({
      status: "success",
      data: patientCID
    });
  } catch (error) {
    console.error("Erro ao criar CID:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao criar CID"
    });
  }
}
async function updatePatientCIDController(request, reply) {
  try {
    const professional = await getUsuarioLogado(request);
    const userOrg = professional.userOrganizations.find(
      (org) => org.role === "professional" || org.role === "admin" || org.role === "owner"
    );
    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem editar CIDs"
      });
    }
    const { id } = request.params;
    const data = request.body;
    const patientCID = await updatePatientCID(professional.id, id, data);
    return reply.status(200).send({
      status: "success",
      data: patientCID
    });
  } catch (error) {
    console.error("Erro ao atualizar CID:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao atualizar CID"
    });
  }
}
async function deletePatientCIDController(request, reply) {
  try {
    const professional = await getUsuarioLogado(request);
    const userOrg = professional.userOrganizations.find(
      (org) => org.role === "professional" || org.role === "admin" || org.role === "owner"
    );
    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem deletar CIDs"
      });
    }
    const { id } = request.params;
    const result = await deletePatientCID(professional.id, id);
    return reply.status(200).send({
      status: "success",
      data: result
    });
  } catch (error) {
    console.error("Erro ao deletar CID:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao deletar CID"
    });
  }
}
async function getPatientCIDsController(request, reply) {
  try {
    const user = await getUsuarioLogado(request);
    const { patientId } = request.params;
    const isOwnCIDs = user.id === patientId;
    const isProfessional = user.userOrganizations.some(
      (org) => org.role === "professional" || org.role === "admin" || org.role === "owner"
    );
    if (!isOwnCIDs && !isProfessional) {
      return reply.status(403).send({
        status: "error",
        message: "Voc\xEA n\xE3o tem permiss\xE3o para visualizar estes CIDs"
      });
    }
    const patientCIDs = await getPatientCIDs(patientId);
    return reply.status(200).send({
      status: "success",
      data: patientCIDs
    });
  } catch (error) {
    console.error("Erro ao buscar CIDs do paciente:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao buscar CIDs"
    });
  }
}
async function getProfessionalCIDsController(request, reply) {
  try {
    const professional = await getUsuarioLogado(request);
    const userOrg = professional.userOrganizations.find(
      (org) => org.role === "professional" || org.role === "admin" || org.role === "owner"
    );
    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem visualizar seus CIDs criados"
      });
    }
    const patientCIDs = await getProfessionalCIDs(professional.id);
    return reply.status(200).send({
      status: "success",
      data: patientCIDs
    });
  } catch (error) {
    console.error("Erro ao buscar CIDs do profissional:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao buscar CIDs"
    });
  }
}
async function getPatientCIDByIdController(request, reply) {
  try {
    const user = await getUsuarioLogado(request);
    const { id } = request.params;
    const patientCID = await getPatientCIDById(id);
    const isPatient = patientCID.patientId === user.id;
    const isProfessional = patientCID.professionalId === user.id;
    const isAdmin = user.userOrganizations.some(
      (org) => org.role === "admin" || org.role === "owner"
    );
    if (!isPatient && !isProfessional && !isAdmin) {
      return reply.status(403).send({
        status: "error",
        message: "Voc\xEA n\xE3o tem permiss\xE3o para visualizar este CID"
      });
    }
    return reply.status(200).send({
      status: "success",
      data: patientCID
    });
  } catch (error) {
    console.error("Erro ao buscar CID:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao buscar CID"
    });
  }
}

// src/routes/patientCID/patientCIDRoutes.ts
async function patientCIDRoutes(app2) {
  app2.withTypeProvider().addHook("preHandler", autenticarToken).post("/patient-cids", createPatientCIDController);
  app2.withTypeProvider().addHook("preHandler", autenticarToken).put("/patient-cids/:id", updatePatientCIDController);
  app2.withTypeProvider().addHook("preHandler", autenticarToken).delete("/patient-cids/:id", deletePatientCIDController);
  app2.withTypeProvider().addHook("preHandler", autenticarToken).get("/patient-cids/patient/:patientId", getPatientCIDsController);
  app2.withTypeProvider().addHook("preHandler", autenticarToken).get("/patient-cids/professional", getProfessionalCIDsController);
  app2.withTypeProvider().addHook("preHandler", autenticarToken).get("/patient-cids/:id", getPatientCIDByIdController);
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
app.register(organizationRoutes);
app.register(patientCIDRoutes);
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
