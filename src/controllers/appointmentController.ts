import { FastifyReply, FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "@/types/AuthenticatedRequest";
import {
  createAppointment,
  generateAvailableSlots,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  createDoctorAvailability,
  getDoctorAvailability,
  deleteDoctorAvailability,
  cancelAppointmentByAttendant,
  canPatientScheduleWithDoctor
} from "@/service/appointmentService.service";
import { AppointmentStatus } from "@prisma/client";
import moment from "moment-timezone";
import { prisma } from "@/lib/prisma";

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

// Criar agendamento para paciente (profissional)
export async function postAppointmentForPatient(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: currentUserId, register } = (request as AuthenticatedRequest)
    .usuario;

  // Verificar se é médico
  if (register !== "doctor" && register !== "attendant") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas médicos podem criar agendamentos para pacientes"
    });
  }

  const { patientId, doctorId, startTime, notes } = request.body as {
    patientId: string;
    doctorId: string;
    startTime: string;
    notes?: string;
  };

  // Verificar se o paciente existe e não é médico
  const patient = await prisma.users.findUnique({
    where: { id: patientId },
    select: { id: true, register: true }
  });

  if (!patient) {
    return reply.status(404).send({
      status: "error",
      message: "Paciente não encontrado"
    });
  }

  if (patient.register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "Não é possível agendar consulta para outro médico"
    });
  }

  // Verificar se o médico existe
  const doctor = await prisma.users.findUnique({
    where: { id: doctorId },
    select: { id: true, register: true }
  });

  if (!doctor || doctor.register !== "doctor") {
    return reply.status(404).send({
      status: "error",
      message: "Médico não encontrado"
    });
  }

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

// Deletar disponibilidade (médico)
export async function deleteAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id: doctorId, register } = (request as AuthenticatedRequest)
      .usuario;

    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas médicos podem deletar disponibilidade"
      });
    }

    const { availabilityId } = request.params as { availabilityId: string };

    const result = await deleteDoctorAvailability(availabilityId, doctorId);

    return reply.status(200).send({
      status: "success",
      data: result
    });
  } catch (error: any) {
    if (error.message?.includes("não encontrada")) {
      return reply.status(404).send({
        status: "error",
        message: error.message
      });
    }

    if (error.message?.includes("agendamentos futuros")) {
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

// Cancelar agendamento (attendant)
export async function cancelAppointmentByAttendantController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é attendant
    const { id: attendantId, register } = (request as AuthenticatedRequest)
      .usuario;

    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem cancelar agendamentos"
      });
    }

    const { appointmentId } = request.params as { appointmentId: string };

    const cancelledAppointment = await cancelAppointmentByAttendant(
      appointmentId,
      attendantId
    );

    return reply.status(200).send({
      status: "success",
      data: cancelledAppointment
    });
  } catch (error: any) {
    if (error.message?.includes("não encontrado")) {
      return reply.status(404).send({
        status: "error",
        message: error.message
      });
    }

    if (error.message?.includes("Não é possível cancelar")) {
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

// Buscar agendamentos de um usuário específico (para atendente)
export async function getUserAppointments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar se o usuário logado é atendente
    const { id: attendantId, register } = (request as AuthenticatedRequest)
      .usuario;

    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem acessar esta rota"
      });
    }

    const { userId } = request.params as { userId: string };
    const { status } = request.query as { status?: AppointmentStatus };

    // Buscar agendamentos do usuário
    const appointments = await getPatientAppointments(userId, status);

    return reply.status(200).send({
      status: "success",
      data: appointments
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos do usuário:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}

// Verificar se o paciente pode agendar com um profissional específico
export async function checkPatientDoctorAvailability(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { patientId, doctorId } = request.params as {
      patientId: string;
      doctorId: string;
    };

    const availability = await canPatientScheduleWithDoctor(
      patientId,
      doctorId
    );

    return reply.status(200).send({
      status: "success",
      data: availability
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
