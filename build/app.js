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

// src/controllers/usuarioController.ts
var import_client2 = require("@prisma/client");

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
async function addUserToOrganization(userId, organizationId, role) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  });
  if (!organization) {
    throw new NotFound("Organization not found");
  }
  const existingAssociation = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId,
      isActive: true
    }
  });
  if (existingAssociation) {
    throw new BadRequest("User is already associated with this organization");
  }
  const userOrganization = await prisma.userOrganization.create({
    data: {
      userId,
      organizationId,
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
async function getUsersFromCurrentOrganization(organizationId) {
  try {
    const users = await prisma.users.findMany({
      where: {
        userOrganizations: {
          some: {
            organizationId,
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
            organizationId,
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
        primaryOrganizationId: organizationId,
        organizations: userOrg ? [
          {
            id: organizationId,
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
async function removeUserFromOrganization(userId, organizationId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) {
    throw new NotFound("User not found");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  });
  if (!organization) {
    throw new NotFound("Organization not found");
  }
  const existingAssociation = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId,
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
    const { userId, organizationId, role } = request.body;
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
      organizationId,
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
var import_zod3 = require("zod");

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

// src/routes/user/usuarioRoutes.ts
async function usuarioRoutes(app) {
  app.withTypeProvider().get("/user", usuarioDocs.getUsuario, getUsuario);
  app.withTypeProvider().get("/professionals", usuarioDocs.getProfessionals, getProfessionals);
  app.withTypeProvider().get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);
  app.withTypeProvider().get("/users/:id", usuarioDocs.getUsuarioById, getUsuarioById);
  app.withTypeProvider().post("/user/login", usuarioDocs.loginUsuario, loginUsuario);
  app.withTypeProvider().post("/user", usuarioDocs.postUsuario, createUsuario);
  app.withTypeProvider().post("/user/admin", usuarioDocs.postUsuarioAdmin, createUsuarioAdmin);
  app.withTypeProvider().put("/user", usuarioDocs.putUsuario, updateUsuario);
  app.withTypeProvider().put("/user/:id", usuarioDocs.putUsuarioByDoctor, updateUsuarioByDoctor);
  app.withTypeProvider().delete("/user/:id", usuarioDocs.deleteUsuario, deleteUsuario);
  app.withTypeProvider().post(
    "/user/organization",
    usuarioDocs.addUserToOrganization,
    addUserToOrganizationController
  );
  app.withTypeProvider().get(
    "/user/:userId/organizations",
    usuarioDocs.getUserOrganizations,
    getUserOrganizationsController
  );
  app.withTypeProvider().get(
    "/user/organization/current",
    usuarioDocs.getUsersFromCurrentOrganization,
    getUsersFromCurrentOrganizationController
  );
  app.withTypeProvider().delete(
    "/user/organization/:userId",
    usuarioDocs.removeUserFromOrganization,
    removeUserFromOrganizationController
  );
  app.withTypeProvider().get(
    "/user/system/all",
    usuarioDocs.getAllUsersFromSystem,
    getAllUsersFromSystemController
  );
  app.withTypeProvider().get("/user/check-email/:email", checkEmailAvailability);
  app.withTypeProvider().get("/user/check-cpf/:cpf", checkCpfAvailability);
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
    const { userId, organizationId, role } = request.body;
    if (!userId || !organizationId || !role) {
      throw new BadRequest("userId, organizationId e role s\xE3o obrigat\xF3rios");
    }
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFound("Usu\xE1rio n\xE3o encontrado");
    }
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    const existingUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });
    if (existingUserOrg) {
      throw new BadRequest("Usu\xE1rio j\xE1 est\xE1 associado a esta organiza\xE7\xE3o");
    }
    const userOrganization = await prisma.userOrganization.create({
      data: {
        userId,
        organizationId,
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
    const { organizationId } = request.params;
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFound("Organiza\xE7\xE3o n\xE3o encontrada");
    }
    const userOrganizations = await prisma.userOrganization.findMany({
      where: {
        organizationId,
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
async function organizationRoutes(fastify) {
  fastify.get("/organizations", getOrganizations);
  fastify.get("/organizations/:id", getOrganization);
  fastify.addHook("preHandler", autenticarToken);
  fastify.post("/organizations", createOrganization);
  fastify.put("/organizations/:id", updateOrganization);
  fastify.delete("/organizations/:id", deleteOrganization);
  fastify.get("/user/organizations", getUserOrganizations);
  fastify.post("/user-organizations", addUserToOrganization2);
  fastify.put("/user-organizations/:id", updateUserOrganization);
  fastify.delete("/user-organizations/:id", removeUserFromOrganization2);
  fastify.get("/organizations/:organizationId/users", getOrganizationUsers);
}

// src/app.ts
function build(opts = {}) {
  const app = (0, import_fastify.default)(opts);
  app.register(import_jwt.default, {
    secret: process.env.JWT_SECRET || "your-secret-key"
  });
  app.register(usuarioRoutes);
  app.register(organizationRoutes);
  return app;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  build
});
