import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/_errors/not-found";
import { BadRequest } from "@/_errors/bad-request";
import { Unauthorized } from "@/_errors/unauthorized";
import { AuthenticatedRequest } from "@/types/AuthenticatedRequest";

export async function createOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
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
    } = request.body as any;

    if (!name) {
      throw new BadRequest("Nome da organização é obrigatório");
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
    console.error("Erro ao criar organização:", error);
    throw error;
  }
}

export async function getOrganizations(
  request: FastifyRequest,
  reply: FastifyReply
) {
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
    console.error("Erro ao buscar organizações:", error);
    throw error;
  }
}

export async function getOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      throw new NotFound("Organização não encontrada");
    }

    return reply.status(200).send({
      status: "success",
      data: organization
    });
  } catch (error) {
    console.error("Erro ao buscar organização:", error);
    throw error;
  }
}

export async function updateOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      throw new NotFound("Organização não encontrada");
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
    console.error("Erro ao atualizar organização:", error);
    throw error;
  }
}

export async function deleteOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      throw new NotFound("Organização não encontrada");
    }

    await prisma.organization.update({
      where: { id },
      data: { isActive: false }
    });

    return reply.status(200).send({
      status: "success",
      message: "Organização removida com sucesso"
    });
  } catch (error) {
    console.error("Erro ao remover organização:", error);
    throw error;
  }
}

export async function getUserOrganizations(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id: userId } = (request as AuthenticatedRequest).usuario;

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
    console.error("Erro ao buscar organizações do usuário:", error);
    throw error;
  }
}

export async function addUserToOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { userId, organizationId, role } = request.body as any;

    if (!userId || !organizationId || !role) {
      throw new BadRequest("userId, organizationId e role são obrigatórios");
    }

    // Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFound("Usuário não encontrado");
    }

    // Verificar se a organização existe
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new NotFound("Organização não encontrada");
    }

    // Verificar se já existe o relacionamento
    const existingUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });

    if (existingUserOrg) {
      throw new BadRequest("Usuário já está associado a esta organização");
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
    console.error("Erro ao adicionar usuário à organização:", error);
    throw error;
  }
}

export async function updateUserOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;

    const userOrganization = await prisma.userOrganization.findUnique({
      where: { id }
    });

    if (!userOrganization) {
      throw new NotFound("Relacionamento usuário-organização não encontrado");
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
      "Erro ao atualizar relacionamento usuário-organização:",
      error
    );
    throw error;
  }
}

export async function removeUserFromOrganization(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    const userOrganization = await prisma.userOrganization.findUnique({
      where: { id }
    });

    if (!userOrganization) {
      throw new NotFound("Relacionamento usuário-organização não encontrado");
    }

    await prisma.userOrganization.update({
      where: { id },
      data: { isActive: false }
    });

    return reply.status(200).send({
      status: "success",
      message: "Usuário removido da organização com sucesso"
    });
  } catch (error) {
    console.error("Erro ao remover usuário da organização:", error);
    throw error;
  }
}

export async function getOrganizationUsers(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { organizationId } = request.params as { organizationId: string };

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new NotFound("Organização não encontrada");
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
    console.error("Erro ao buscar usuários da organização:", error);
    throw error;
  }
}
