import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Unauthorized } from "@/_errors/unauthorized";
import { BadRequest } from "@/_errors/bad-request";
import { Prisma } from "@prisma/client";
import moment from "moment-timezone";
import { NotFound } from "@/_errors/not-found";
import { AuthenticatedRequest } from "@/types/AuthenticatedRequest";
import { FastifyRequest } from "fastify";

export const selectUsuario = {
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

// Função para serializar o usuário corretamente
function serializeUser(user: any) {
  return {
    ...user,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
  };
}

// Função para serializar organizações do usuário
function serializeUserOrganizations(userOrganizations: any[]) {
  return userOrganizations.map((uo) => ({
    organizationId: uo.organization.id,
    role: uo.role,
    organizationName: uo.organization.name,
    joinedAt: uo.joinedAt ? uo.joinedAt.toISOString() : null,
    createdAt: uo.createdAt ? uo.createdAt.toISOString() : null,
    updatedAt: uo.updatedAt ? uo.updatedAt.toISOString() : null
  }));
}

export async function authenticateUser(
  email: string,
  password: string,
  fastify: any
) {
  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      password: true,
      ...selectUsuario
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Unauthorized("Invalid credentials");
  }

  const { password: _, ...userWithoutPassword } = user;

  // Buscar organizações do usuário para determinar o papel principal
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

  // Determinar o papel principal (prioridade: owner > admin > professional > attendant > patient > member)
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
      const priority =
        rolePriority[userOrg.role as keyof typeof rolePriority] || 0;
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

export async function searchUsuario(usuarioId: string) {
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

  // Determinar o papel principal (prioridade: owner > admin > professional > attendant > patient > member)
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

export const getUsuarioLogado = async (request: FastifyRequest) => {
  const usuarioId = (request as AuthenticatedRequest).usuario.id;
  return searchUsuario(usuarioId);
};

export const getUsuarioLogadoIsAdmin = async (request: FastifyRequest) => {
  const { id: usuarioId, primaryRole } = (request as AuthenticatedRequest)
    .usuario;

  // Verifica se o usuário tem papel de professional, admin ou owner
  const allowedRoles = ["professional", "admin", "owner"];
  if (!allowedRoles.includes(primaryRole)) {
    throw new Unauthorized("User is not authorized");
  }

  return searchUsuario(usuarioId);
};

export const getUsuarioLogadoIsAdminOrAttendant = async (
  request: FastifyRequest
) => {
  const { id: usuarioId, primaryRole } = (request as AuthenticatedRequest)
    .usuario;

  // Verifica se o usuário tem papel de professional, admin, owner ou attendant
  const allowedRoles = ["professional", "admin", "owner", "attendant"];
  if (!allowedRoles.includes(primaryRole)) {
    throw new Unauthorized("User is not authorized");
  }

  return searchUsuario(usuarioId);
};

export async function getUserById(usuarioId: string) {
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

export async function getUserByEmail(email: string) {
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

export async function getUserExisting({
  email,
  cpf
}: {
  email?: string | null;
  cpf?: string | null;
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
      console.log("Email já existe:", email);
      throw new BadRequest(`Email ${email} já está em uso`);
    }
  }

  if (cpf) {
    const existingUserByCpf = await prisma.users.findUnique({
      where: { cpf },
      select: { id: true, cpf: true }
    });

    if (existingUserByCpf) {
      console.log("CPF já existe:", cpf);
      throw new BadRequest(`CPF ${cpf} já está em uso`);
    }
  }

  console.log("Email e CPF disponíveis para uso");
  return;
}

export async function createUser(data: Prisma.UsersCreateInput) {
  console.log("=== CREATE USER ===");
  console.log("Dados recebidos:", JSON.stringify(data, null, 2));

  if (!data.password) {
    throw new BadRequest("Password is required");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.users.create({
    data: {
      ...data,
      birthDate: data.birthDate
        ? moment(data.birthDate).isValid()
          ? moment(data.birthDate).toDate()
          : null
        : null,
      password: hashedPassword
    },
    select: selectUsuario
  });

  console.log("Usuário criado com sucesso:", user.email);

  // Retornar usuário com campos padrão para novo usuário
  return {
    ...serializeUser(user),
    primaryRole: "member",
    primaryOrganizationId: null,
    organizations: []
  };
}

export async function createUserAdmin(data: Prisma.UsersCreateInput) {
  console.log("=== CREATE USER ADMIN ===");
  console.log("Dados recebidos:", JSON.stringify(data, null, 2));

  if (!data.password) {
    throw new BadRequest("Password is required");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.users.create({
    data: {
      ...data,
      birthDate: data.birthDate
        ? moment(data.birthDate).isValid()
          ? moment(data.birthDate).toDate()
          : null
        : null,
      password: hashedPassword
    },
    select: selectUsuario
  });

  console.log("Usuário criado com sucesso:", user.email);

  // Retornar usuário com campos padrão para novo usuário
  return {
    ...serializeUser(user),
    primaryRole: "member",
    primaryOrganizationId: null,
    organizations: []
  };
}

export async function updateUser(
  usuarioId: string,
  data: Prisma.UsersUncheckedUpdateInput
) {
  try {
    console.log("=== UPDATE USER SERVICE ===");
    console.log("UsuarioId:", usuarioId);
    console.log("Dados recebidos:", JSON.stringify(data, null, 2));

    // Usar todos os dados permitidos para atualização
    const allowedData = data;

    const searchUser = await prisma.users.findUnique({
      where: {
        id: usuarioId
      },
      select: selectUsuario
    });

    console.log("Usuário encontrado:", searchUser ? "Sim" : "Não");

    if (!searchUser) {
      throw new NotFound("User not found");
    }

    if (allowedData.email && allowedData.email !== searchUser.email) {
      if (typeof allowedData.email === "string") {
        // Verificar se já existe outro usuário com este email
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
        // Verificar se já existe outro usuário com este CPF
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
      allowedData.password = await bcrypt.hash(
        allowedData.password as string,
        10
      );
    }

    // Converter birthDate para Date se for string
    if (allowedData.birthDate && typeof allowedData.birthDate === "string") {
      console.log("Convertendo birthDate para Date...");
      allowedData.birthDate = new Date(allowedData.birthDate);
    }

    // Remove campos com null, pois Prisma não aceita null para Date por padrão
    const dadosLimpos = Object.fromEntries(
      Object.entries(allowedData).filter(
        ([_, value]) => value !== null && value !== undefined
      )
    );

    console.log(
      "Dados limpos para atualização:",
      JSON.stringify(dadosLimpos, null, 2)
    );

    // Tratamento específico para numberOfAddress
    if (
      dadosLimpos.numberOfAddress === "" ||
      dadosLimpos.numberOfAddress === null
    ) {
      console.log("Removendo numberOfAddress vazio...");
      delete dadosLimpos.numberOfAddress;
    }

    // Tratamento específico para campos de endereço
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

    // Verificar se há campos que podem causar problemas
    const camposProblema = Object.entries(dadosLimpos).filter(
      ([key, value]) => {
        if (value === "" || value === "null" || value === "undefined") {
          console.log(`Campo problemático encontrado: ${key} = ${value}`);
          return true;
        }
        return false;
      }
    );

    if (camposProblema.length > 0) {
      console.log("Removendo campos com valores vazios ou inválidos...");
      camposProblema.forEach(([key, value]) => {
        delete dadosLimpos[key];
      });
    }

    console.log(
      "Dados finais para atualização:",
      JSON.stringify(dadosLimpos, null, 2)
    );

    const usuarioAtualizado = await prisma.users.update({
      where: { id: usuarioId },
      data: {
        ...dadosLimpos
      },
      select: selectUsuario
    });

    console.log("Usuário atualizado com sucesso no banco");

    // Buscar organizações do usuário para incluir no response
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

    // Determinar o papel principal (prioridade: owner > admin > professional > attendant > patient > member)
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
        const priority =
          rolePriority[userOrg.role as keyof typeof rolePriority] || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          primaryRole = userOrg.role;
          primaryOrganizationId = userOrg.organizationId;
        }
      }
    }

    // Formatar organizações para o response
    const organizations = userOrganizations.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.name,
      role: uo.role
    }));

    // Retornar usuário com campos adicionais
    return {
      ...serializeUser(usuarioAtualizado),
      primaryRole,
      primaryOrganizationId,
      organizations
    };
  } catch (err: any) {
    console.error("Erro na função updateUser:", err);
    console.error("Código do erro:", err.code);
    console.error("Mensagem do erro:", err.message);

    if (err.code === "P2002") {
      throw new BadRequest("User already exists");
    }
    throw err;
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.users.findMany({
      select: selectUsuario,
      orderBy: [{ name: "asc" }]
    });

    // Para cada usuário, buscar suas organizações e determinar o papel principal
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

        // Determinar o papel principal (prioridade: owner > admin > professional > attendant > patient > member)
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
            const priority =
              rolePriority[userOrg.role as keyof typeof rolePriority] || 0;
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

export async function getAllProfessionals() {
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

export async function updateUserByProfessional(
  targetUserId: string,
  data: Prisma.UsersUncheckedUpdateInput
) {
  // Função para profissionais atualizarem dados de usuários
  // Apenas administradores (professionals) podem chamar esta função
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
      // Verificar se já existe outro usuário com este email
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
      // Verificar se já existe outro usuário com este CPF
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
    data.password = await bcrypt.hash(data.password as string, 10);
  }

  // Converter birthDate para Date se for string
  if (data.birthDate && typeof data.birthDate === "string") {
    data.birthDate = new Date(data.birthDate);
  }

  // Remove campos com null, pois Prisma não aceita null para Date por padrão
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
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new BadRequest("User already exists");
    }
    throw err;
  }
}

export async function deleteUser(usuarioId: string, adminId: string) {
  // Verificar se o usuário a ser deletado existe
  const searchUser = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });

  if (!searchUser) {
    throw new NotFound("User not found");
  }

  // Verificar se o admin não está tentando deletar a si mesmo
  if (usuarioId === adminId) {
    throw new BadRequest("Admin cannot delete themselves");
  }

  // Deletar o usuário
  await prisma.users.delete({
    where: {
      id: usuarioId
    }
  });

  return { message: "User deleted successfully" };
}

// Buscar disponibilidades do médico
export async function getDoctorAvailability(doctorId: string) {
  const availabilities = await prisma.availability.findMany({
    where: {
      doctorId,
      isActive: true
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return availabilities;
}

export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  role: string
) {
  // Verificar se o usuário existe
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new NotFound("User not found");
  }

  // Verificar se a organização existe
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  });

  if (!organization) {
    throw new NotFound("Organization not found");
  }

  // Verificar se já existe uma associação ativa
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

  // Criar a associação
  const userOrganization = await prisma.userOrganization.create({
    data: {
      userId,
      organizationId,
      role: role as any,
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

export async function getUsersFromCurrentOrganization(organizationId: string) {
  try {
    const users = await prisma.users.findMany({
      where: {
        userOrganizations: {
          some: {
            organizationId: organizationId,
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
            organizationId: organizationId,
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
        organizations: userOrg
          ? [
              {
                id: organizationId,
                role: userOrg.role,
                joinedAt: userOrg.joinedAt,
                isActive: userOrg.isActive
              }
            ]
          : []
      };
    });
  } catch (error) {
    console.error("Erro em getUsersFromCurrentOrganization:", error);
    throw error;
  }
}

export async function removeUserFromOrganization(
  userId: string,
  organizationId: string
) {
  // Verificar se o usuário existe
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new NotFound("User not found");
  }

  // Verificar se a organização existe
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  });

  if (!organization) {
    throw new NotFound("Organization not found");
  }

  // Verificar se existe uma associação ativa
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

  // Desativar a associação (soft delete)
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

export async function getAllUsersFromSystem() {
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
      // Determinar o papel principal baseado na organização mais recente
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
