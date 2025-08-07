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

// src/service/patientCIDService.service.ts
var patientCIDService_service_exports = {};
__export(patientCIDService_service_exports, {
  createPatientCID: () => createPatientCID,
  deletePatientCID: () => deletePatientCID,
  getPatientCIDById: () => getPatientCIDById,
  getPatientCIDs: () => getPatientCIDs,
  getProfessionalCIDs: () => getProfessionalCIDs,
  updatePatientCID: () => updatePatientCID
});
module.exports = __toCommonJS(patientCIDService_service_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createPatientCID,
  deletePatientCID,
  getPatientCIDById,
  getPatientCIDs,
  getProfessionalCIDs,
  updatePatientCID
});
