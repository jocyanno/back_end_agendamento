import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";
import { Unauthorized } from "@/_errors/unauthorized";

// Função para criar um CID para um paciente
export async function createPatientCID(
  professionalId: string,
  data: {
    patientId: string;
    organizationId: string;
    cid: string;
    description?: string;
  }
) {
  // Verificar se o profissional existe e é realmente um profissional
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
    throw new NotFound("Profissional não encontrado");
  }

  if (professional.userOrganizations.length === 0) {
    throw new Unauthorized(
      "Você não tem permissão para criar CIDs nesta organização"
    );
  }

  // Verificar se o paciente existe
  const patient = await prisma.users.findUnique({
    where: { id: data.patientId }
  });

  if (!patient) {
    throw new NotFound("Paciente não encontrado");
  }

  // Verificar se já existe um CID para este paciente/profissional/organização
  const existingCID = await prisma.patientCID.findUnique({
    where: {
      patientId_professionalId_organizationId: {
        patientId: data.patientId,
        professionalId: professionalId,
        organizationId: data.organizationId
      }
    }
  });

  if (existingCID) {
    throw new BadRequest("Já existe um CID para este paciente criado por você");
  }

  // Criar o CID
  const patientCID = await prisma.patientCID.create({
    data: {
      patientId: data.patientId,
      professionalId: professionalId,
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

// Função para atualizar um CID
export async function updatePatientCID(
  professionalId: string,
  patientCIDId: string,
  data: {
    cid: string;
    description?: string;
  }
) {
  // Verificar se o CID existe e pertence ao profissional
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
    throw new NotFound("CID não encontrado");
  }

  if (patientCID.professionalId !== professionalId) {
    throw new Unauthorized("Você só pode editar CIDs criados por você");
  }

  // Atualizar o CID
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

// Função para deletar um CID
export async function deletePatientCID(
  professionalId: string,
  patientCIDId: string
) {
  // Verificar se o CID existe e pertence ao profissional
  const patientCID = await prisma.patientCID.findUnique({
    where: { id: patientCIDId }
  });

  if (!patientCID) {
    throw new NotFound("CID não encontrado");
  }

  if (patientCID.professionalId !== professionalId) {
    throw new Unauthorized("Você só pode deletar CIDs criados por você");
  }

  // Deletar o CID
  await prisma.patientCID.delete({
    where: { id: patientCIDId }
  });

  return { message: "CID deletado com sucesso" };
}

// Função para buscar CIDs de um paciente (para visualização do paciente)
export async function getPatientCIDs(patientId: string) {
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

// Função para buscar CIDs criados por um profissional
export async function getProfessionalCIDs(professionalId: string) {
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

// Função para buscar um CID específico
export async function getPatientCIDById(patientCIDId: string) {
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
    throw new NotFound("CID não encontrado");
  }

  return patientCID;
}
