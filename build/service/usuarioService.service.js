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

// src/service/usuarioService.service.ts
var usuarioService_service_exports = {};
__export(usuarioService_service_exports, {
  addUserToOrganization: () => addUserToOrganization,
  authenticateUser: () => authenticateUser,
  createUser: () => createUser,
  createUserAdmin: () => createUserAdmin,
  deleteUser: () => deleteUser,
  getAllProfessionals: () => getAllProfessionals,
  getAllUsers: () => getAllUsers,
  getAllUsersFromSystem: () => getAllUsersFromSystem,
  getDoctorAvailability: () => getDoctorAvailability,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUserExisting: () => getUserExisting,
  getUsersFromCurrentOrganization: () => getUsersFromCurrentOrganization,
  getUsuarioLogado: () => getUsuarioLogado,
  getUsuarioLogadoIsAdmin: () => getUsuarioLogadoIsAdmin,
  getUsuarioLogadoIsAdminOrAttendant: () => getUsuarioLogadoIsAdminOrAttendant,
  removeUserFromOrganization: () => removeUserFromOrganization,
  searchUsuario: () => searchUsuario,
  selectUsuario: () => selectUsuario,
  updateUser: () => updateUser,
  updateUserByProfessional: () => updateUserByProfessional
});
module.exports = __toCommonJS(usuarioService_service_exports);

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
async function getUserByEmail(email) {
  const user = await prisma.users.findUnique({
    where: {
      email
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
async function getAllProfessionals() {
  const professionals = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      createdAt: true
    },
    orderBy: {
      name: "asc"
    }
  });
  return professionals.map(serializeUser);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addUserToOrganization,
  authenticateUser,
  createUser,
  createUserAdmin,
  deleteUser,
  getAllProfessionals,
  getAllUsers,
  getAllUsersFromSystem,
  getDoctorAvailability,
  getUserByEmail,
  getUserById,
  getUserExisting,
  getUsersFromCurrentOrganization,
  getUsuarioLogado,
  getUsuarioLogadoIsAdmin,
  getUsuarioLogadoIsAdminOrAttendant,
  removeUserFromOrganization,
  searchUsuario,
  selectUsuario,
  updateUser,
  updateUserByProfessional
});
