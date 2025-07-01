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
  cid: true,
  register: true,
  createdAt: true,
  updatedAt: true
};

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

  const token = await fastify.jwt.sign(
    { userId: user.id, register: user.register },
    { expiresIn: "7d" }
  );

  return {
    token,
    usuario: userWithoutPassword
  };
}

export async function searchUsuario(usuarioId: string) {
  const searchUserExisting = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });

  if (!searchUserExisting) {
    throw new NotFound("User not found");
  }

  return searchUserExisting;
}

export const getUsuarioLogado = async (request: FastifyRequest) => {
  const usuarioId = (request as AuthenticatedRequest).usuario.id;
  return searchUsuario(usuarioId);
};

export const getUsuarioLogadoIsAdmin = async (request: FastifyRequest) => {
  const { id: usuarioId, register } = (request as AuthenticatedRequest).usuario;

  // Verifica diretamente do token se é doctor, mais eficiente
  if (register !== "doctor") {
    throw new Unauthorized("User is not doctor");
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

  return user;
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
  let user = null;

  if (email) {
    user = await prisma.users.findUnique({
      where: {
        email
      },
      select: selectUsuario
    });

    if (user) {
      throw new BadRequest("User already exists");
    }
  }

  if (cpf) {
    user = await prisma.users.findUnique({
      where: {
        cpf
      },
      select: selectUsuario
    });

    if (user) {
      throw new BadRequest("User already exists");
    }
  }

  return;
}

export async function createUser(data: Prisma.UsersCreateInput) {
  if (data.register === "doctor") {
    throw new BadRequest("Register doctor is not allowed");
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

  return user;
}

export async function createUserAdmin(data: Prisma.UsersCreateInput) {
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

  return user;
}

export async function updateUser(
  usuarioId: string,
  data: Prisma.UsersUncheckedUpdateInput
) {
  // Remover campo 'cid' se presente - apenas admins podem alterar
  const { cid, ...allowedData } = data;

  const searchUser = await prisma.users.findUnique({
    where: {
      id: usuarioId
    },
    select: selectUsuario
  });

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
    allowedData.password = await bcrypt.hash(
      allowedData.password as string,
      10
    );
  }

  // Converter birthDate para Date se for string
  if (allowedData.birthDate && typeof allowedData.birthDate === "string") {
    allowedData.birthDate = new Date(allowedData.birthDate);
  }

  // Remove campos com null, pois Prisma não aceita null para Date por padrão
  const dadosLimpos = Object.fromEntries(
    Object.entries(allowedData).filter(([_, value]) => value !== null)
  );

  try {
    const usuarioAtualizado = await prisma.users.update({
      where: { id: usuarioId },
      data: {
        ...dadosLimpos
      },
      select: selectUsuario
    });
    return usuarioAtualizado;
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new BadRequest("User already exists");
    }
    throw err;
  }
}

export async function getAllUsers() {
  const users = await prisma.users.findMany({
    select: selectUsuario,
    orderBy: [
      { register: "desc" }, // doctors primeiro
      { name: "asc" }
    ]
  });

  return users;
}

export async function getAllDoctors() {
  const doctors = await prisma.users.findMany({
    where: {
      register: "doctor"
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      cid: true,
      register: true,
      createdAt: true
    },
    orderBy: {
      name: "asc"
    }
  });

  return doctors;
}

export async function updateUserByDoctor(
  targetUserId: string,
  data: Prisma.UsersUncheckedUpdateInput
) {
  // Esta é a única função que permite alterar o campo 'cid'
  // Apenas administradores (doctors) podem chamar esta função
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
    return usuarioAtualizado;
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
