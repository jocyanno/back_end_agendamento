import { FastifyReply, FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "@/types/AuthenticatedRequest";
import {
  createAppointment,
  generateAvailableSlots,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  createDoctorAvailability,
  getDoctorAvailability
} from "@/service/appointmentService.service";
import { AppointmentStatus } from "@prisma/client";
import moment from "moment-timezone";

// Criar novo agendamento (paciente)
export async function postAppointment(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: patientId, register } = (request as AuthenticatedRequest).usuario;

  if (register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "Médicos não podem agendar consultas para si mesmos"
    });
  }

  const { doctorId, startTime, notes } = request.body as {
    doctorId: string;
    startTime: string;
    notes?: string;
  };

  // Calcular endTime (50 minutos de sessão)
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1000); // +50 minutos

  const appointment = await createAppointment({
    patientId,
    doctorId,
    startTime,
    endTime: endDate.toISOString(),
    notes
  });

  return reply.status(201).send({
    status: "success",
    data: appointment
  });
}

// Buscar horários disponíveis
export async function getAvailableSlots(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { doctorId, date } = request.query as {
    doctorId: string;
    date: string;
  };

  const slots = await generateAvailableSlots(doctorId, date);

  return reply.status(200).send({
    status: "success",
    data: slots
  });
}

// Buscar agendamentos do usuário logado
export async function getMyAppointments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: userId, register } = (request as AuthenticatedRequest).usuario;
  const { status } = request.query as { status?: AppointmentStatus };

  let appointments;

  if (register === "doctor") {
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    appointments = await getDoctorAppointments(userId, start, end);
  } else {
    appointments = await getPatientAppointments(userId, status);
  }

  return reply.status(200).send({
    status: "success",
    data: appointments
  });
}

// Atualizar status do agendamento
export async function putAppointmentStatus(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: appointmentId } = request.params as { id: string };
  const { status } = request.body as { status: AppointmentStatus };
  const { id: userId, register } = (request as AuthenticatedRequest).usuario;

  const updatedAppointment = await updateAppointmentStatus(
    appointmentId,
    status,
    userId,
    register
  );

  return reply.status(200).send({
    status: "success",
    data: updatedAppointment
  });
}

// Criar disponibilidade (médico)
export async function postAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id: doctorId, register } = (request as AuthenticatedRequest)
      .usuario;

    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas médicos podem configurar disponibilidade"
      });
    }

    const availability = request.body as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };

    const created = await createDoctorAvailability(doctorId, availability);

    return reply.status(201).send({
      status: "success",
      data: created
    });
  } catch (error: any) {
    if (error.message?.includes("Já existe disponibilidade")) {
      return reply.status(400).send({
        status: "error",
        message: error.message
      });
    }

    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}

// Buscar disponibilidade do médico
export async function getAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { doctorId } = request.params as { doctorId: string };

  const availabilities = await getDoctorAvailability(doctorId);

  return reply.status(200).send({
    status: "success",
    data: availabilities
  });
}

// Buscar agendamentos do dia (médico)
export async function getTodayAppointments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: doctorId, register } = (request as AuthenticatedRequest).usuario;

  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas médicos podem acessar esta rota"
    });
  }

  const today = moment().tz("America/Sao_Paulo");
  const startOfDay = today.clone().startOf("day").toDate();
  const endOfDay = today.clone().endOf("day").toDate();

  const appointments = await getDoctorAppointments(
    doctorId,
    startOfDay,
    endOfDay
  );

  return reply.status(200).send({
    status: "success",
    data: appointments
  });
}
