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

// src/controllers/organizationController.ts
var organizationController_exports = {};
__export(organizationController_exports, {
  addUserToOrganization: () => addUserToOrganization,
  createOrganization: () => createOrganization,
  deleteOrganization: () => deleteOrganization,
  getOrganization: () => getOrganization,
  getOrganizationUsers: () => getOrganizationUsers,
  getOrganizations: () => getOrganizations,
  getUserOrganizations: () => getUserOrganizations,
  removeUserFromOrganization: () => removeUserFromOrganization,
  updateOrganization: () => updateOrganization,
  updateUserOrganization: () => updateUserOrganization
});
module.exports = __toCommonJS(organizationController_exports);

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/_errors/not-found.ts
var NotFound = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFound";
  }
};

// src/_errors/bad-request.ts
var BadRequest = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest";
  }
};

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
async function addUserToOrganization(request, reply) {
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
async function removeUserFromOrganization(request, reply) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addUserToOrganization,
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizationUsers,
  getOrganizations,
  getUserOrganizations,
  removeUserFromOrganization,
  updateOrganization,
  updateUserOrganization
});
