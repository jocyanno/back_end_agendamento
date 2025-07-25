import { prisma } from "@/lib/prisma";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";
import { Unauthorized } from "@/_errors/unauthorized";
import { AppointmentStatus } from "@prisma/client";
import moment from "moment-timezone";

import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation
} from "@/service/notificationService.service";

const TIMEZONE = "America/Sao_Paulo";
const SESSION_DURATION_MINUTES = 50;
const BREAK_DURATION_MINUTES = 10;
const START_HOUR = 7;
const START_MINUTE = 30;
const END_HOUR = 20;

export const selectAppointment = {
  id: true,
  patientId: true,
  doctorId: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
};

export const selectAppointmentWithUsers = {
  ...selectAppointment,
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  }
};

// Verificar se o paciente já tem agendamento na semana
export const checkWeeklyAppointmentLimit = async (
  patientId: string,
  date: Date
): Promise<void> => {
  const startOfWeek = moment(date).tz(TIMEZONE).startOf("week").toDate();
  const endOfWeek = moment(date).tz(TIMEZONE).endOf("week").toDate();

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patientId,
      startTime: {
        gte: startOfWeek,
        lte: endOfWeek
      },
      status: {
        notIn: ["cancelled", "no_show"]
      }
    }
  });

  if (existingAppointment) {
    throw new Error("Paciente já possui consulta agendada nesta semana");
  }
};

// Verificar se o horário está disponível
export async function checkSlotAvailability(
  doctorId: string,
  startTime: Date,
  endTime: Date
) {
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: {
        notIn: ["cancelled", "no_show"]
      },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }
  });

  if (conflictingAppointment) {
    throw new BadRequest("Este horário já está ocupado");
  }
}

// Função para debug dos horários
function debugSlotGeneration(
  requestedDate: moment.Moment,
  availability: any,
  now: moment.Moment,
  isToday: boolean,
  currentSlot: moment.Moment
) {
  console.log("=== DEBUG SLOT GENERATION ===");
  console.log("Data solicitada:", requestedDate.format("DD/MM/YYYY"));
  console.log("Horário atual:", now.format("DD/MM/YYYY HH:mm"));
  console.log("É hoje?", isToday);
  console.log(
    "Disponibilidade médico:",
    availability.startTime,
    "-",
    availability.endTime
  );
  console.log(
    "Primeiro slot calculado:",
    currentSlot.format("DD/MM/YYYY HH:mm")
  );
  console.log("Timezone:", TIMEZONE);
  console.log("================================");
}

// Gerar slots disponíveis para um dia
export async function generateAvailableSlots(doctorId: string, date: string) {
  const requestedDate = moment(date).tz(TIMEZONE);
  const dayOfWeek = requestedDate.day();

  // Buscar disponibilidade do médico para o dia da semana
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true
    }
  });

  if (!availability) {
    return [];
  }

  // Buscar agendamentos existentes no dia
  const startOfDay = requestedDate.clone().startOf("day").toDate();
  const endOfDay = requestedDate.clone().endOf("day").toDate();

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        notIn: ["cancelled", "no_show"]
      }
    },
    orderBy: {
      startTime: "asc"
    }
  });

  // Gerar slots baseados na disponibilidade
  const slots = [];
  const [availStartHour, availStartMin] = availability.startTime
    .split(":")
    .map(Number);
  const [availEndHour, availEndMin] = availability.endTime
    .split(":")
    .map(Number);

  // Determinar o horário de início
  const startHour = availStartHour;
  const startMin = availStartMin;

  let currentSlot = requestedDate
    .clone()
    .hour(startHour)
    .minute(startMin)
    .second(0)
    .millisecond(0);

  // Se for hoje e o horário de início já passou, começar pelo próximo slot disponível
  const now = moment().tz(TIMEZONE);
  const isToday = requestedDate.isSame(now, "day");

  if (isToday && currentSlot.isBefore(now)) {
    // Começar pelo próximo horário redondo disponível
    const currentHour = now.hour();
    const currentMinute = now.minute();

    // Se já passou dos minutos, ir para a próxima hora
    if (currentMinute > 0) {
      currentSlot = now.clone().add(1, "hour").startOf("hour");
    } else {
      currentSlot = now.clone().startOf("hour");
    }

    // Garantir que o slot está dentro da disponibilidade do médico
    if (
      currentSlot.hour() < startHour ||
      (currentSlot.hour() === startHour && currentSlot.minute() < startMin)
    ) {
      currentSlot = requestedDate.clone().hour(startHour).minute(startMin);
    }
  }

  // Debug dos horários (descomentar apenas para debug)
  // debugSlotGeneration(requestedDate, availability, now, isToday, currentSlot);

  const availEndTime = requestedDate
    .clone()
    .hour(availEndHour)
    .minute(availEndMin);
  const serviceEndTime = requestedDate.clone().hour(END_HOUR).minute(0);

  const endTime = availEndTime.isBefore(serviceEndTime)
    ? availEndTime
    : serviceEndTime;

  while (currentSlot.isBefore(endTime)) {
    const slotEnd = currentSlot
      .clone()
      .add(SESSION_DURATION_MINUTES, "minutes");

    // Verificar se o slot não conflita com agendamentos existentes
    const isAvailable = !existingAppointments.some((appointment) => {
      const appointmentStart = moment(appointment.startTime).tz(TIMEZONE);
      const appointmentEnd = moment(appointment.endTime).tz(TIMEZONE);
      return (
        currentSlot.isBefore(appointmentEnd) &&
        slotEnd.isAfter(appointmentStart)
      );
    });

    // Verificar se o slot não está no passado
    // Se for hoje, verificar se o horário já passou
    // Se for dia futuro, todos os horários são válidos
    const isPastSlot = isToday && currentSlot.isBefore(now);

    if (isAvailable && !isPastSlot && slotEnd.isSameOrBefore(endTime)) {
      // Criar horário UTC com o valor do horário brasileiro
      // Exemplo: 08:00 BRT vira 08:00 UTC (não 11:00 UTC)
      const startTimeUTC = moment
        .utc()
        .year(currentSlot.year())
        .month(currentSlot.month())
        .date(currentSlot.date())
        .hour(currentSlot.hour())
        .minute(currentSlot.minute())
        .second(0)
        .millisecond(0);

      const endTimeUTC = moment
        .utc()
        .year(slotEnd.year())
        .month(slotEnd.month())
        .date(slotEnd.date())
        .hour(slotEnd.hour())
        .minute(slotEnd.minute())
        .second(0)
        .millisecond(0);

      slots.push({
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        available: true
      });
    }

    // Próximo slot (sessão + intervalo)
    currentSlot.add(
      SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES,
      "minutes"
    );
  }

  // Os slots são retornados em formato UTC mas com horário brasileiro
  // Exemplo: 08:00 BRT = 08:00 UTC (2025-07-03T08:00:00.000Z)
  return slots;
}

// Criar agendamento
export const createAppointment = async (appointmentData: any) => {
  const { patientId, doctorId, startTime, endTime, notes } = appointmentData;

  // Verificar se é string (corrigir se vier objeto)
  const patientIdString =
    typeof patientId === "string" ? patientId : patientId.id;
  const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;

  // Validar se patient existe
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });

  if (!patient) {
    throw new Error("Paciente não encontrado");
  }

  // Validar se doctor existe
  const doctor = await prisma.users.findUnique({
    where: { id: doctorIdString, register: "doctor" }
  });

  if (!doctor) {
    throw new Error("Médico não encontrado");
  }

  // Verificar limite semanal
  await checkWeeklyAppointmentLimit(patientIdString, new Date(startTime));

  // Verificar conflito de horário
  await checkSlotAvailability(
    doctorIdString,
    new Date(startTime),
    new Date(endTime)
  );

  // Criar o agendamento
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      doctorId: doctorIdString,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes: notes || "",
      status: "scheduled"
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  // Google Calendar removido - agendamento criado apenas no sistema

  // Enviar notificação de confirmação (sistema próprio)
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notificação de confirmação:", error);
  }

  return appointment;
};

// Buscar agendamentos do paciente
export async function getPatientAppointments(
  patientId: string,
  status?: AppointmentStatus
) {
  const where: any = { patientId };

  if (status) {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    select: selectAppointmentWithUsers,
    orderBy: {
      startTime: "desc"
    }
  });

  return appointments;
}

// Buscar agendamentos do médico
export async function getDoctorAppointments(
  doctorId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { doctorId };

  if (startDate && endDate) {
    where.startTime = {
      gte: startDate,
      lte: endDate
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    select: selectAppointmentWithUsers,
    orderBy: {
      startTime: "asc"
    }
  });

  return appointments;
}

// Atualizar status do agendamento
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  userId: string,
  userRole: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true
    }
  });

  if (!appointment) {
    throw new NotFound("Agendamento não encontrado");
  }

  // Verificar permissões
  if (userRole === "patient" && appointment.patientId !== userId) {
    throw new Unauthorized(
      "Você não tem permissão para alterar este agendamento"
    );
  }

  if (userRole === "doctor" && appointment.doctorId !== userId) {
    throw new Unauthorized(
      "Você não tem permissão para alterar este agendamento"
    );
  }

  // Regras de negócio para mudança de status
  if (appointment.status === "completed" || appointment.status === "no_show") {
    throw new BadRequest(
      "Não é possível alterar o status de um agendamento finalizado"
    );
  }

  if (status === "cancelled") {
    const now = moment().tz(TIMEZONE);
    const appointmentTime = moment(appointment.startTime).tz(TIMEZONE);
    const hoursUntilAppointment = appointmentTime.diff(now, "hours");

    if (hoursUntilAppointment < 24) {
      throw new BadRequest(
        "Agendamentos só podem ser cancelados com 24h de antecedência"
      );
    }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    select: selectAppointmentWithUsers
  });

  // Enviar notificação de cancelamento se for cancelamento
  if (status === "cancelled") {
    try {
      await sendAppointmentCancellation(updatedAppointment);
    } catch (error) {
      console.error("Erro ao enviar notificação de cancelamento:", error);
    }
  }

  return updatedAppointment;
}

// Criar disponibilidade do médico
export async function createDoctorAvailability(
  doctorId: string,
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }
) {
  // Verificar se já existe disponibilidade para este dia
  const existing = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      isActive: true
    }
  });

  if (existing) {
    throw new BadRequest(
      "Já existe disponibilidade configurada para este dia da semana"
    );
  }

  const created = await prisma.availability.create({
    data: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isActive: true
    }
  });

  return created;
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

export const getAppointmentById = async (appointmentId: string) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return appointment;
  } catch (error) {
    console.error("Error fetching appointment by ID:", error);
    return null;
  }
};

// Deletar disponibilidade do médico
export async function deleteDoctorAvailability(
  availabilityId: string,
  doctorId: string
) {
  // Verificar se a disponibilidade existe e pertence ao médico
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId,
      isActive: true
    }
  });

  if (!availability) {
    throw new NotFound("Disponibilidade não encontrada");
  }

  // Verificar se existem agendamentos futuros para esta disponibilidade
  const dayOfWeek = availability.dayOfWeek;
  const startTime = availability.startTime;
  const endTime = availability.endTime;

  // Buscar agendamentos futuros que possam estar usando esta disponibilidade
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: {
        gte: new Date()
      },
      status: {
        in: ["scheduled", "confirmed"]
      }
    }
  });

  // Verificar se há agendamentos que podem estar conflitando
  const conflictingAppointments = futureAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    const appointmentDayOfWeek = appointmentDate.getDay();
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // HH:mm

    return (
      appointmentDayOfWeek === dayOfWeek &&
      appointmentTime >= startTime &&
      appointmentTime < endTime
    );
  });

  if (conflictingAppointments.length > 0) {
    throw new BadRequest(
      "Não é possível deletar esta disponibilidade pois existem agendamentos futuros"
    );
  }

  // Deletar a disponibilidade
  await prisma.availability.delete({
    where: {
      id: availabilityId
    }
  });

  return { message: "Disponibilidade deletada com sucesso" };
}

// Cancelar agendamento (attendant)
export async function cancelAppointmentByAttendant(
  appointmentId: string,
  attendantId: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true
    }
  });

  if (!appointment) {
    throw new NotFound("Agendamento não encontrado");
  }

  // Verificar se o agendamento pode ser cancelado
  if (appointment.status === "completed" || appointment.status === "no_show" || appointment.status === "cancelled") {
    throw new BadRequest(
      "Não é possível cancelar um agendamento finalizado ou já cancelado"
    );
  }

  // Verificar se o agendamento é futuro
  const now = moment().tz(TIMEZONE);
  const appointmentTime = moment(appointment.startTime).tz(TIMEZONE);
  
  if (appointmentTime.isBefore(now)) {
    throw new BadRequest(
      "Não é possível cancelar um agendamento que já passou"
    );
  }

  // Verificar se o attendant tem permissão (pode cancelar qualquer agendamento)
  // Esta verificação pode ser expandida para verificar se o attendant trabalha com o médico específico

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
    select: selectAppointmentWithUsers
  });

  // Enviar notificação de cancelamento
  try {
    await sendAppointmentCancellation(updatedAppointment);
  } catch (error) {
    console.error("Erro ao enviar notificação de cancelamento:", error);
  }

  return updatedAppointment;
}
