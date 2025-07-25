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
  getUsersByRegistrar,
  updateUser,
  updateUserByDoctor,
  getPatientsByDoctor,
  createPatientForDoctor
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

    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });

    // Usar o registeredBy enviado no JSON ou undefined se não fornecido
    const createUsuario = await createUser(
      parseResult,
      parseResult.registeredBy || undefined
    );

    const token = request.server.jwt.sign(
      { userId: createUsuario.id, register: createUsuario.register },
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
  // Verificar se o usuário logado é admin
  const admin = await getUsuarioLogadoIsAdmin(request);

  const parseResult = request.body as Prisma.UsersCreateInput;

  console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));

  await getUserExisting({
    email: parseResult.email,
    cpf: parseResult.cpf
  });

  // Passar o ID do admin como registeredBy
  const createUsuario = await createUserAdmin(parseResult, admin.id);

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

export async function getUsuariosByRegistrar(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await getUsuarioLogadoIsAdmin(request);

  const doctor = await getUsuarioLogadoIsAdmin(request);

  const users = await getUsersByRegistrar(doctor.id);

  return reply.status(200).send({
    status: "success",
    data: users
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

// Buscar pacientes de um médico (attendant)
export async function getPacientesByDoctor(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificar se o usuário logado é attendant
  const attendant = await getUsuarioLogado(request);

  if (attendant.register !== "attendant") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas atendentes podem acessar esta rota"
    });
  }

  const { doctorId } = request.params as { doctorId: string };

  const patients = await getPatientsByDoctor(doctorId);

  return reply.status(200).send({
    status: "success",
    data: patients
  });
}

// Criar paciente para um médico (attendant)
export async function createPacienteForDoctor(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é attendant
    const attendant = await getUsuarioLogado(request);

    if (attendant.register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem criar pacientes"
      });
    }

    const { doctorId } = request.params as { doctorId: string };
    const parseResult = request.body as Prisma.UsersCreateInput;

    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));

    await getUserExisting({
      email: parseResult.email,
      cpf: parseResult.cpf
    });

    const createPaciente = await createPatientForDoctor(parseResult, doctorId);

    return reply.status(201).send({
      status: "success",
      data: { paciente: createPaciente }
    });
  } catch (error) {
    console.error("Erro na criação de paciente:", error);
    return reply.status(400).send({
      status: "error",
      message: error instanceof Error ? error.message : "Validation error"
    });
  }
}

// Obter dados para formulário de criação de usuário
export async function getFormData(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Buscar médicos disponíveis para o campo registeredBy
    const doctors = await getAllDoctors();

    // Definir tipos de registro disponíveis
    const registerTypes = [
      { value: "patient", label: "Paciente" },
      { value: "parents", label: "Responsável" },
      { value: "attendant", label: "Atendente" }
    ];

    return reply.status(200).send({
      status: "success",
      data: {
        doctors,
        registerTypes
      }
    });
  } catch (error) {
    console.error("Erro ao buscar dados do formulário:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
