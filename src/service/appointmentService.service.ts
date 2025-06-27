import { prisma } from "@/lib/prisma";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";
import { Unauthorized } from "@/_errors/unauthorized";
import { AppointmentStatus } from "@prisma/client";
import moment from "moment-timezone";
import {
  createCalendarEvent,
  deleteCalendarEvent
} from "@/service/googleCalendarService.service";
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
  googleEventId: true,
  googleMeetLink: true,
  reminderSent: true,
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

  let currentSlot = requestedDate
    .clone()
    .hour(Math.max(availStartHour, START_HOUR))
    .minute(
      availStartHour === START_HOUR
        ? Math.max(availStartMin, START_MINUTE)
        : availStartMin
    )
    .second(0)
    .millisecond(0);

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
    const isPastSlot = currentSlot.isBefore(moment().tz(TIMEZONE));

    if (isAvailable && !isPastSlot && slotEnd.isSameOrBefore(endTime)) {
      slots.push({
        startTime: currentSlot.toISOString(),
        endTime: slotEnd.toISOString(),
        available: true
      });
    }

    // Próximo slot (sessão + intervalo)
    currentSlot.add(
      SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES,
      "minutes"
    );
  }

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

  // Se o agendamento foi cancelado, cancelar no Google Calendar e enviar notificação
  if (status === "cancelled") {
    // Cancelar evento no Google Calendar
    if (appointment.googleEventId) {
      try {
        await deleteCalendarEvent(appointment.googleEventId);
      } catch (error) {
        console.error("Erro ao cancelar evento no Google Calendar:", error);
      }
    }

    // Enviar notificação de cancelamento
    try {
      await sendAppointmentCancellation(appointment);
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
  // Verificar se já existe disponibilidade para este dia/horário
  const existing = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      OR: [
        {
          startTime: {
            lte: availability.startTime
          },
          endTime: {
            gt: availability.startTime
          }
        },
        {
          startTime: {
            lt: availability.endTime
          },
          endTime: {
            gte: availability.endTime
          }
        }
      ]
    }
  });

  if (existing) {
    throw new BadRequest(
      "Já existe disponibilidade configurada para este horário"
    );
  }

  const created = await prisma.availability.create({
    data: {
      doctorId,
      ...availability
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
