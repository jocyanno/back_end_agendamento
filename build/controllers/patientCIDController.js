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

// src/controllers/patientCIDController.ts
var patientCIDController_exports = {};
__export(patientCIDController_exports, {
  createPatientCIDController: () => createPatientCIDController,
  deletePatientCIDController: () => deletePatientCIDController,
  getPatientCIDByIdController: () => getPatientCIDByIdController,
  getPatientCIDsController: () => getPatientCIDsController,
  getProfessionalCIDsController: () => getProfessionalCIDsController,
  updatePatientCIDController: () => updatePatientCIDController
});
module.exports = __toCommonJS(patientCIDController_exports);

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

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

// src/service/usuarioService.service.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_moment_timezone = __toESM(require("moment-timezone"));
function serializeUser(user) {
  return {
    ...user,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createPatientCIDController,
  deletePatientCIDController,
  getPatientCIDByIdController,
  getPatientCIDsController,
  getProfessionalCIDsController,
  updatePatientCIDController
});
