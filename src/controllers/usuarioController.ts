import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import {
  createUser,
  createUserAdmin,
  deleteUser,
  getAllUsers,
  getProfessionals,
  getUserById,
  getUserByEmail,
  getUserExisting,
  updateUser,
  updateUserByProfessional,
  addUserToOrganization,
  getUsersFromCurrentOrganization,
  removeUserFromOrganization,
  authenticateUser,
  getAllUsersFromSystem
} from "@/service/usuarioService.service";
import {
  getUsuarioLogado,
  getUsuarioLogadoIsAdmin,
  getUsuarioLogadoIsAdminOrAttendant
} from "@/service/usuarioService.service";
import { BadRequest, NotFound, Unauthorized } from "@/utils/errors";

const prisma = new PrismaClient();

export async function getUsuario(request: FastifyRequest, reply: FastifyReply) {
  const usuario = await getUsuarioLogado(request);

  return reply.status(200).send({
    status: "success",
    data: usuario
  });
}

export async function loginUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);

    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    console.log("Email:", email);
    console.log("Password length:", password?.length);

    if (!email || !password) {
      console.log("Missing email or password");
      return reply.status(400).send({
        status: "error",
        message: "Email e senha são obrigatórios"
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
      message: error instanceof Error ? error.message : "Credenciais inválidas"
    });
  }
}

export async function createUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log("=== CREATE USER ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);

    const parseResult = request.body as Prisma.UsersCreateInput;

    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
    console.log("userType recebido:", parseResult.userType);
    console.log("organizationId recebido:", parseResult.organizationId);

    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });

    const createUsuario = await createUser(parseResult);

    const token = request.server.jwt.sign(
      { userId: createUsuario.id },
      { expiresIn: "7d" }
    );

    console.log("Usuário criado com sucesso:", createUsuario.email);

    return reply.status(200).send({
      status: "success",
      data: { token, usuario: createUsuario }
    });
  } catch (error) {
    console.error("Erro na criação de usuário:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Validation error"
    });
  }
}

export async function createUsuarioAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log("=== CREATE USER ADMIN ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);

    // Verificar se o usuário logado é admin ou owner
    const admin = await getUsuarioLogadoIsAdmin(request);
    console.log("Admin logado:", admin.id);
    console.log("Admin primaryOrganizationId:", admin.primaryOrganizationId);
    console.log("Admin primaryRole:", admin.primaryRole);
    console.log("Admin organizations:", admin.organizations);

    const parseResult = request.body as Prisma.UsersCreateInput & {
      userType?: "patient" | "professional" | "parent";
      organizationId?: string;
    };

    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
    console.log("userType recebido:", parseResult.userType);
    console.log("organizationId recebido:", parseResult.organizationId);

    // Validar email e CPF duplicados
    console.log("Validando email e CPF...");
    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });
    console.log("Email e CPF válidos");

    const createUsuario = await createUserAdmin(parseResult);
    console.log("Usuário criado:", createUsuario.id);

    // Determinar a organização onde o usuário será vinculado
    let targetOrganizationId = parseResult.organizationId;
    let userRole = parseResult.userType || "patient";

    // Se não foi fornecido organizationId, usar a organização primária do admin
    if (!targetOrganizationId) {
      targetOrganizationId = admin.primaryOrganizationId;
      console.log(
        "Usando organização primária do admin:",
        targetOrganizationId
      );
    }

    // Se ainda não temos uma organização, não podemos vincular o usuário
    if (!targetOrganizationId) {
      console.log("Nenhuma organização disponível para vincular o usuário");
      console.log("Admin não tem organização primária definida");
    } else {
      console.log("Adicionando usuário à organização:", targetOrganizationId);

      // Determinar o role baseado no userType
      let role: string;
      switch (userRole) {
        case "patient":
          role = "patient";
          break;
        case "professional":
          role = "professional";
          break;
        case "parent":
          role = "patient"; // Parentes são tratados como pacientes
          break;
        default:
          role = "patient";
      }

      console.log("Role determinado:", role);

      await prisma.userOrganization.create({
        data: {
          userId: createUsuario.id,
          organizationId: targetOrganizationId,
          role: role as any
        }
      });
      console.log("Usuário adicionado à organização com sucesso");
    }

    const token = request.server.jwt.sign(
      { userId: createUsuario.id },
      { expiresIn: "7d" }
    );

    console.log("Token gerado com sucesso");

    return reply.status(200).send({
      status: "success",
      data: { token, usuario: createUsuario }
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

export async function updateUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log("=== UPDATE USER ATTEMPT ===");
    console.log("Headers:", request.headers);
    console.log("Body:", request.body);

    const usuario = await getUsuarioLogado(request);
    console.log("Usuário logado:", usuario.id);

    const parseResult = request.body as Prisma.UsersUncheckedUpdateInput;
    console.log(
      "Dados para atualização:",
      JSON.stringify(parseResult, null, 2)
    );

    const updateUsuario = await updateUser(usuario.id, parseResult);
    console.log("Usuário atualizado com sucesso");

    return reply.code(200).send({
      status: "success",
      data: updateUsuario
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

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

export async function getProfessionals(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const professionals = await getAllProfessionals();

  return reply.status(200).send({
    status: "success",
    data: professionals
  });
}

export async function getAllUsuarios(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é doctor
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

export async function getUsuarioById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é doctor
  await getUsuarioLogadoIsAdmin(request);

  const { id } = request.params as { id: string };

  const user = await getUserById(id);

  return reply.status(200).send({
    status: "success",
    data: user
  });
}

export async function updateUsuarioByDoctor(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é doctor
  await getUsuarioLogadoIsAdmin(request);

  const { id } = request.params as { id: string };
  const parseResult = request.body as Prisma.UsersUncheckedUpdateInput;

  const updateUsuario = await updateUserByProfessional(id, parseResult);

  return reply.status(200).send({
    status: "success",
    data: updateUsuario
  });
}

export async function deleteUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é admin
  const admin = await getUsuarioLogadoIsAdmin(request);

  // Pegar o ID do usuário a ser deletado dos parâmetros
  const { id } = request.params as { id: string };

  // Deletar o usuário
  const result = await deleteUser(id, admin.id);

  return reply.code(200).send({
    status: "success",
    data: result
  });
}

export async function addUserToOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é admin ou owner
    await getUsuarioLogadoIsAdmin(request);

    const { userId, organizationId, role } = request.body as {
      userId: string;
      organizationId: string;
      role: string;
    };

    // Determinar o role baseado no tipo
    let finalRole: string;
    switch (role) {
      case "patient":
        finalRole = "patient";
        break;
      case "professional":
        finalRole = "professional";
        break;
      case "parent":
        finalRole = "patient"; // Parentes são tratados como pacientes
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
    console.error("Erro ao adicionar usuário à organização:", error);
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

export async function getUserOrganizationsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário está autenticado
    const loggedUser = await getUsuarioLogado(request);
    const { userId } = request.params as { userId: string };

    // Verificar se o usuário está tentando acessar suas próprias organizações
    if (loggedUser.id !== userId) {
      return reply.status(403).send({
        status: "error",
        message: "Acesso negado. Você só pode ver suas próprias organizações."
      });
    }

    const userOrganizations = await prisma.userOrganization.findMany({
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

    // Formatar os dados para retornar no formato que o schema espera
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

export async function getUsersFromCurrentOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é admin ou owner
    await getUsuarioLogadoIsAdmin(request);

    // Pegar o organizationId do usuário logado
    const user = await getUsuarioLogado(request);

    // Buscar a organização ativa do usuário
    const userOrganization = await prisma.userOrganization.findFirst({
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
        message: "Usuário não está associado a nenhuma organização"
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

export async function removeUserFromOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é admin ou owner
    await getUsuarioLogadoIsAdmin(request);

    const { userId } = request.params as { userId: string };

    // Pegar o organizationId do usuário logado
    const user = await getUsuarioLogado(request);

    // Buscar a organização ativa do usuário
    const userOrganization = await prisma.userOrganization.findFirst({
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
        message: "Usuário não está associado a nenhuma organização"
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

export async function getAllUsersFromSystemController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é admin, owner ou member
    const user = await getUsuarioLogado(request);
    const allowedRoles = ["owner", "admin", "member"];

    if (!user.primaryRole || !allowedRoles.includes(user.primaryRole)) {
      return reply.status(403).send({
        status: "error",
        message:
          "Acesso negado. Apenas proprietários, administradores e membros podem visualizar todos os usuários."
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

export async function checkEmailAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { email } = request.params as { email: string };

    console.log("=== CHECK EMAIL AVAILABILITY ===");
    console.log("Email:", email);

    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    const isAvailable = !existingUser;

    console.log("Email disponível:", isAvailable);

    return reply.status(200).send({
      status: "success",
      data: {
        email,
        isAvailable,
        message: isAvailable ? "Email disponível" : "Email já está em uso"
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

export async function checkCpfAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { cpf } = request.params as { cpf: string };

    console.log("=== CHECK CPF AVAILABILITY ===");
    console.log("CPF:", cpf);

    const existingUser = await prisma.users.findUnique({
      where: { cpf },
      select: { id: true, cpf: true }
    });

    const isAvailable = !existingUser;

    console.log("CPF disponível:", isAvailable);

    return reply.status(200).send({
      status: "success",
      data: {
        cpf,
        isAvailable,
        message: isAvailable ? "CPF disponível" : "CPF já está em uso"
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
