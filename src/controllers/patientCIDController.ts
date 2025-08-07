import { FastifyReply, FastifyRequest } from "fastify";
import {
  createPatientCID,
  updatePatientCID,
  deletePatientCID,
  getPatientCIDs,
  getProfessionalCIDs,
  getPatientCIDById
} from "@/service/patientCIDService.service";
import { getUsuarioLogado } from "@/service/usuarioService.service";

// Criar um CID para um paciente
export async function createPatientCIDController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const professional = await getUsuarioLogado(request);

    // Verificar se o usuário é um profissional
    const userOrg = professional.userOrganizations.find(
      (org) =>
        org.role === "professional" ||
        org.role === "admin" ||
        org.role === "owner"
    );

    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem criar CIDs"
      });
    }

    const data = request.body as {
      patientId: string;
      organizationId: string;
      cid: string;
      description?: string;
    };

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

// Atualizar um CID
export async function updatePatientCIDController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const professional = await getUsuarioLogado(request);

    // Verificar se o usuário é um profissional
    const userOrg = professional.userOrganizations.find(
      (org) =>
        org.role === "professional" ||
        org.role === "admin" ||
        org.role === "owner"
    );

    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem editar CIDs"
      });
    }

    const { id } = request.params as { id: string };
    const data = request.body as {
      cid: string;
      description?: string;
    };

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

// Deletar um CID
export async function deletePatientCIDController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const professional = await getUsuarioLogado(request);

    // Verificar se o usuário é um profissional
    const userOrg = professional.userOrganizations.find(
      (org) =>
        org.role === "professional" ||
        org.role === "admin" ||
        org.role === "owner"
    );

    if (!userOrg) {
      return reply.status(403).send({
        status: "error",
        message: "Apenas profissionais podem deletar CIDs"
      });
    }

    const { id } = request.params as { id: string };

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

// Buscar CIDs de um paciente (para visualização do paciente)
export async function getPatientCIDsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = await getUsuarioLogado(request);
    const { patientId } = request.params as { patientId: string };

    // Verificar se o usuário está buscando seus próprios CIDs ou é um profissional
    const isOwnCIDs = user.id === patientId;
    const isProfessional = user.userOrganizations.some(
      (org) =>
        org.role === "professional" ||
        org.role === "admin" ||
        org.role === "owner"
    );

    if (!isOwnCIDs && !isProfessional) {
      return reply.status(403).send({
        status: "error",
        message: "Você não tem permissão para visualizar estes CIDs"
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

// Buscar CIDs criados por um profissional
export async function getProfessionalCIDsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const professional = await getUsuarioLogado(request);

    // Verificar se o usuário é um profissional
    const userOrg = professional.userOrganizations.find(
      (org) =>
        org.role === "professional" ||
        org.role === "admin" ||
        org.role === "owner"
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

// Buscar um CID específico
export async function getPatientCIDByIdController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = await getUsuarioLogado(request);
    const { id } = request.params as { id: string };

    const patientCID = await getPatientCIDById(id);

    // Verificar permissões
    const isPatient = patientCID.patientId === user.id;
    const isProfessional = patientCID.professionalId === user.id;
    const isAdmin = user.userOrganizations.some(
      (org) => org.role === "admin" || org.role === "owner"
    );

    if (!isPatient && !isProfessional && !isAdmin) {
      return reply.status(403).send({
        status: "error",
        message: "Você não tem permissão para visualizar este CID"
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
