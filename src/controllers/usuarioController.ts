import { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

import {
  authenticateUser,
  createUser,
  createUserAdmin,
  deleteUser,
  getAllDoctors,
  getAllUsers,
  getUserById,
  getUserExisting,
  getUsuarioLogado,
  getUsuarioLogadoIsAdmin,
  updateUser,
  updateUserByDoctor
} from "@/service/usuarioService.service";

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
  const { email, password } = request.body as {
    email: string;
    password: string;
  };

  const user = await authenticateUser(email, password, request.server);

  return reply.status(200).send({
    status: "success",
    data: { token: user.token, usuario: user.usuario }
  });
}

export async function createUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parseResult = request.body as Prisma.UsersCreateInput;

  console.log(parseResult);

  await getUserExisting({
    email: parseResult.email,
    cpf: parseResult.cpf
  });

  const createUsuario = await createUser(parseResult);

  const token = request.server.jwt.sign(
    { userId: createUsuario.id, register: createUsuario.register },
    { expiresIn: "7d" }
  );

  return reply.status(200).send({
    status: "success",
    data: { token, usuario: createUsuario }
  });
}

export async function createUsuarioAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é admin
  await getUsuarioLogadoIsAdmin(request);

  const parseResult = request.body as Prisma.UsersCreateInput;

  await getUserExisting({
    email: parseResult.email,
    cpf: parseResult.cpf
  });

  const createUsuario = await createUserAdmin(parseResult);

  const token = request.server.jwt.sign(
    { userId: createUsuario.id, register: createUsuario.register },
    { expiresIn: "7d" }
  );

  return reply.status(200).send({
    status: "success",
    data: { token, usuario: createUsuario }
  });
}

export async function updateUsuario(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const usuario = await getUsuarioLogado(request);

  const parseResult = request.body as Prisma.UsersUncheckedUpdateInput;

  const updateUsuario = await updateUser(usuario.id, parseResult);

  return reply.code(200).send({
    status: "success",
    data: updateUsuario
  });
}

export async function getDoctors(request: FastifyRequest, reply: FastifyReply) {
  const doctors = await getAllDoctors();

  return reply.status(200).send({
    status: "success",
    data: doctors
  });
}

export async function getAllUsuarios(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é doctor
  await getUsuarioLogadoIsAdmin(request);

  const users = await getAllUsers();

  return reply.status(200).send({
    status: "success",
    data: users
  });
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

  const updateUsuario = await updateUserByDoctor(id, parseResult);

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
