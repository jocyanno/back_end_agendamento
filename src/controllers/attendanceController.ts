import { FastifyReply, FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "@/types/AuthenticatedRequest";
import { prisma } from "@/lib/prisma";

// POST /attendances
export async function postAttendance(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: professionalId, primaryRole } = (request as AuthenticatedRequest)
    .usuario;
  if (primaryRole !== "professional") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem registrar atendimentos"
    });
  }
  const { patientId, description, date } = request.body as {
    patientId: string;
    description: string;
    date?: string;
  };
  const attendance = await prisma.attendance.create({
    data: {
      patientId,
      professionalId,
      description,
      date: date ? new Date(date) : undefined
    },
    include: {
      patient: true,
      professional: true
    }
  });
  return reply.status(201).send({
    status: "success",
    data: attendance
  });
}

// GET /attendances/my
export async function getMyAttendances(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: userId, primaryRole } = (request as AuthenticatedRequest).usuario;
  let where = {};
  if (primaryRole === "professional") {
    where = { professionalId: userId };
  } else {
    where = { patientId: userId };
  }
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      patient: true,
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}

// GET /attendances/patient/:id
export async function getPatientAttendances(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: professionalId, primaryRole } = (request as AuthenticatedRequest)
    .usuario;
  if (primaryRole !== "professional") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas profissionais podem acessar o histórico de pacientes"
    });
  }
  const { id: patientId } = request.params as { id: string };
  const attendances = await prisma.attendance.findMany({
    where: { patientId },
    include: {
      patient: true,
      professional: true
    },
    orderBy: { date: "desc" }
  });
  return reply.status(200).send({
    status: "success",
    data: attendances
  });
}
