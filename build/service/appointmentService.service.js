"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/service/appointmentService.service.ts
var appointmentService_service_exports = {};
__export(appointmentService_service_exports, {
  canPatientScheduleWithProfessional: () => canPatientScheduleWithProfessional,
  cancelAppointmentByAttendant: () => cancelAppointmentByAttendant,
  checkSlotAvailability: () => checkSlotAvailability,
  checkSlotAvailabilityForAttendant: () => checkSlotAvailabilityForAttendant,
  createAppointment: () => createAppointment,
  createAppointmentForAttendant: () => createAppointmentForAttendant,
  createProfessionalAvailability: () => createProfessionalAvailability,
  deleteProfessionalAvailability: () => deleteProfessionalAvailability,
  fixAppointmentTimezones: () => fixAppointmentTimezones,
  generateAvailableSlots: () => generateAvailableSlots,
  getAppointmentById: () => getAppointmentById,
  getPatientAppointments: () => getPatientAppointments,
  getProfessionalAppointments: () => getProfessionalAppointments,
  getProfessionalAvailability: () => getProfessionalAvailability,
  selectAppointment: () => selectAppointment,
  selectAppointmentWithUsers: () => selectAppointmentWithUsers,
  updateAppointmentStatus: () => updateAppointmentStatus
});
module.exports = __toCommonJS(appointmentService_service_exports);

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/_errors/bad-request.ts
var BadRequest = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest";
  }
};

// src/_errors/not-found.ts
var NotFound = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFound";
  }
};

// src/_errors/unauthorized.ts
var Unauthorized = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthorized";
  }
};

// src/service/appointmentService.service.ts
var import_moment_timezone2 = __toESM(require("moment-timezone"));

// src/service/notificationService.service.ts
var import_moment_timezone = __toESM(require("moment-timezone"));
var TIMEZONE = "America/Sao_Paulo";
function getAppointmentConfirmationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Confirma\xE7\xE3o de Agendamento</h2>
      <p>Ol\xE1 ${data.patientName},</p>
      <p>Seu agendamento foi confirmado com sucesso!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Hor\xE1rio:</strong> ${data.time}</p>
        ${data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ""}
      </div>
      
      <p><strong>Importante:</strong> Caso precise cancelar, fa\xE7a isso com pelo menos 24 horas de anteced\xEAncia.</p>
      <p><strong>Lembrete:</strong> O evento foi adicionado ao seu calend\xE1rio Google.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}
function getAppointmentCancellationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Agendamento Cancelado</h2>
      <p>Ol\xE1 ${data.patientName},</p>
      <p>Informamos que seu agendamento foi cancelado.</p>
      
      <div style="background-color: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento Cancelado:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Hor\xE1rio:</strong> ${data.time}</p>
        ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}
      </div>
      
      <p>Se desejar, voc\xEA pode agendar um novo hor\xE1rio atrav\xE9s do nosso sistema.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}
async function createNotification(data) {
  return await prisma.notification.create({
    data
  });
}
async function sendAppointmentConfirmation(appointment) {
  const date = (0, import_moment_timezone.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = (0, import_moment_timezone.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "confirmation",
    title: "Agendamento Confirmado",
    message: `Seu agendamento com ${appointment.professional.name} foi confirmado para ${date} \xE0s ${time}`
  });
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
    date,
    time
  });
}
async function sendAppointmentCancellation(appointment, reason) {
  const date = (0, import_moment_timezone.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = (0, import_moment_timezone.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "cancellation",
    title: "Agendamento Cancelado",
    message: `Seu agendamento com ${appointment.professional.name} para ${date} \xE0s ${time} foi cancelado`
  });
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
    date,
    time,
    reason
  });
}

// src/service/appointmentService.service.ts
var TIMEZONE2 = "America/Sao_Paulo";
var SESSION_DURATION_MINUTES = 50;
var BREAK_DURATION_MINUTES = 10;
var END_HOUR = 20;
var selectAppointment = {
  id: true,
  patientId: true,
  professionalId: true,
  organizationId: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
};
var selectAppointmentWithUsers = {
  ...selectAppointment,
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  professional: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  },
  organization: {
    select: {
      id: true,
      name: true
    }
  }
};
async function checkSlotAvailability(professionalId, organizationId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone2.default)(startTime).add(3, "hours").toDate();
  const localEndTime = (0, import_moment_timezone2.default)(endTime).add(3, "hours").toDate();
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE: ${(0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone2.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = (0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
      organizationId,
      dayOfWeek,
      isActive: true
    }
  });
  if (!availability) {
    throw new BadRequest(
      "M\xE9dico n\xE3o possui disponibilidade para este dia da semana"
    );
  }
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  const availabilityStart = appointmentDate.clone().hour(availStartHour).minute(availStartMin);
  const availabilityEnd = appointmentDate.clone().hour(availEndHour).minute(availEndMin);
  const requestedStart = (0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2);
  const requestedEnd = (0, import_moment_timezone2.default)(localEndTime).tz(TIMEZONE2);
  if (requestedStart.isBefore(availabilityStart) || requestedEnd.isAfter(availabilityEnd)) {
    throw new BadRequest(
      "Hor\xE1rio solicitado est\xE1 fora do per\xEDodo de disponibilidade do m\xE9dico"
    );
  }
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      professionalId,
      organizationId,
      startTime: {
        lt: localEndTime
      },
      endTime: {
        gt: localStartTime
      },
      status: {
        in: ["scheduled", "confirmed"]
      }
    }
  });
  if (existingAppointment) {
    throw new BadRequest("J\xE1 existe um agendamento neste hor\xE1rio");
  }
  return true;
}
async function generateAvailableSlots(professionalId, date) {
  console.log(`
=== INICIANDO GERA\xC7\xC3O DE SLOTS ===`);
  console.log(`Data solicitada: ${date}`);
  console.log(`Profissional ID: ${professionalId}`);
  const requestedDate = (0, import_moment_timezone2.default)(date).tz(TIMEZONE2);
  const dayOfWeek = requestedDate.day();
  console.log(`Dia da semana: ${dayOfWeek} (${requestedDate.format("dddd")})`);
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
      dayOfWeek,
      isActive: true
    }
  });
  console.log(`Disponibilidade encontrada:`, availability ? "SIM" : "N\xC3O");
  if (availability) {
    console.log(
      `   Hor\xE1rio: ${availability.startTime} - ${availability.endTime}`
    );
    console.log(`   ID: ${availability.id}`);
  }
  if (!availability) {
    console.log(`\u274C NENHUMA DISPONIBILIDADE CONFIGURADA PARA ESTE DIA`);
    console.log(`=== FIM GERA\xC7\xC3O DE SLOTS ===
`);
    return [];
  }
  const startOfDay = requestedDate.clone().startOf("day").toDate();
  const endOfDay = requestedDate.clone().endOf("day").toDate();
  console.log(
    `\u{1F50D} Buscando agendamentos entre: ${(0, import_moment_timezone2.default)(startOfDay).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} e ${(0, import_moment_timezone2.default)(endOfDay).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")}`
  );
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      professionalId,
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
  console.log(`=== AGENDAMENTOS EXISTENTES PARA ${date} ===`);
  console.log(`Profissional ID: ${professionalId}`);
  console.log(`Total de agendamentos: ${existingAppointments.length}`);
  existingAppointments.forEach((appointment, index) => {
    console.log(
      `${index + 1}. ${(0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE2).format("HH:mm")} - ${(0, import_moment_timezone2.default)(appointment.endTime).tz(TIMEZONE2).format("HH:mm")} (${appointment.status})`
    );
  });
  console.log("==========================================");
  const slots = [];
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  console.log(`
\u{1F4C5} CONFIGURA\xC7\xC3O DE HOR\xC1RIOS:`);
  console.log(
    `   In\xEDcio disponibilidade: ${availStartHour}:${availStartMin.toString().padStart(2, "0")}`
  );
  console.log(
    `   Fim disponibilidade: ${availEndHour}:${availEndMin.toString().padStart(2, "0")}`
  );
  console.log(`   Dura\xE7\xE3o da sess\xE3o: ${SESSION_DURATION_MINUTES} minutos`);
  console.log(`   Intervalo entre sess\xF5es: ${BREAK_DURATION_MINUTES} minutos`);
  const startHour = availStartHour;
  const startMin = availStartMin;
  let currentSlot = requestedDate.clone().hour(startHour).minute(startMin).second(0).millisecond(0);
  const now = (0, import_moment_timezone2.default)().tz(TIMEZONE2);
  const isToday = requestedDate.isSame(now, "day");
  console.log(`
\u23F0 VERIFICA\xC7\xC3O DE HOR\xC1RIO:`);
  console.log(`   \xC9 hoje? ${isToday}`);
  console.log(`   Hor\xE1rio atual: ${now.format("HH:mm")}`);
  console.log(`   Primeiro slot calculado: ${currentSlot.format("HH:mm")}`);
  if (isToday && currentSlot.isBefore(now)) {
    const currentHour = now.hour();
    const currentMinute = now.minute();
    if (currentMinute > 0) {
      currentSlot = now.clone().add(1, "hour").startOf("hour");
    } else {
      currentSlot = now.clone().startOf("hour");
    }
    if (currentSlot.hour() < startHour || currentSlot.hour() === startHour && currentSlot.minute() < startMin) {
      currentSlot = requestedDate.clone().hour(startHour).minute(startMin);
    }
    console.log(`   \u26A0\uFE0F  Hor\xE1rio ajustado para: ${currentSlot.format("HH:mm")}`);
  }
  const availEndTime = requestedDate.clone().hour(availEndHour).minute(availEndMin);
  const serviceEndTime = requestedDate.clone().hour(END_HOUR).minute(0);
  const endTime = availEndTime.isBefore(serviceEndTime) ? availEndTime : serviceEndTime;
  console.log(`
\u{1F504} INICIANDO LOOP DE GERA\xC7\xC3O DE SLOTS:`);
  console.log(
    `   Hor\xE1rio de fim da disponibilidade: ${availEndTime.format("HH:mm")}`
  );
  console.log(
    `   Hor\xE1rio de fim do servi\xE7o: ${serviceEndTime.format("HH:mm")}`
  );
  console.log(`   Hor\xE1rio de fim usado: ${endTime.format("HH:mm")}`);
  console.log(`   Slot inicial: ${currentSlot.format("HH:mm")}`);
  let slotCount = 0;
  while (currentSlot.isBefore(endTime)) {
    slotCount++;
    const slotEnd = currentSlot.clone().add(SESSION_DURATION_MINUTES, "minutes");
    console.log(
      `
   \u{1F4CD} Slot ${slotCount}: ${currentSlot.format(
        "HH:mm"
      )} - ${slotEnd.format("HH:mm")}`
    );
    const conflictingAppointment = existingAppointments.find((appointment) => {
      const appointmentStart = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE2);
      const appointmentEnd = (0, import_moment_timezone2.default)(appointment.endTime).tz(TIMEZONE2);
      const slotEndsBeforeAppointment = slotEnd.isSameOrBefore(appointmentStart);
      const slotStartsAfterAppointment = currentSlot.isSameOrAfter(appointmentEnd);
      return !(slotEndsBeforeAppointment || slotStartsAfterAppointment);
    });
    const isAvailable = !conflictingAppointment;
    if (!isAvailable && conflictingAppointment) {
      console.log(
        `     \u274C CONFLITO: Conflita com agendamento ${conflictingAppointment.id}`
      );
      console.log(
        `        Agendamento: ${(0, import_moment_timezone2.default)(conflictingAppointment.startTime).format(
          "HH:mm"
        )} - ${(0, import_moment_timezone2.default)(conflictingAppointment.endTime).format("HH:mm")}`
      );
    }
    const isPastSlot = isToday && currentSlot.isBefore(now);
    if (isPastSlot) {
      console.log(`     \u23F0 PASSADO: Slot j\xE1 passou`);
    }
    console.log(
      `     Status: ${isAvailable && !isPastSlot ? "\u2705 DISPON\xCDVEL" : "\u274C INDISPON\xCDVEL"}`
    );
    if (isAvailable && !isPastSlot && slotEnd.isSameOrBefore(endTime)) {
      const startTimeUTC = import_moment_timezone2.default.utc().year(currentSlot.year()).month(currentSlot.month()).date(currentSlot.date()).hour(currentSlot.hour()).minute(currentSlot.minute()).second(0).millisecond(0);
      const endTimeUTC = import_moment_timezone2.default.utc().year(slotEnd.year()).month(slotEnd.month()).date(slotEnd.date()).hour(slotEnd.hour()).minute(slotEnd.minute()).second(0).millisecond(0);
      slots.push({
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        available: true
      });
      console.log(
        `\u2705 SLOT DISPON\xCDVEL: ${currentSlot.format("HH:mm")} - ${slotEnd.format(
          "HH:mm"
        )}`
      );
    }
    currentSlot.add(
      SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES,
      "minutes"
    );
  }
  console.log(`
\u{1F4CA} RESUMO FINAL:`);
  console.log(`   Total de slots verificados: ${slotCount}`);
  console.log(`   Slots dispon\xEDveis gerados: ${slots.length}`);
  console.log(
    `   Slots dispon\xEDveis:`,
    slots.map((slot) => (0, import_moment_timezone2.default)(slot.startTime).format("HH:mm")).join(", ")
  );
  console.log(`=== FIM GERA\xC7\xC3O DE SLOTS ===
`);
  return slots;
}
async function fixAppointmentTimezones() {
  console.log("\u{1F527} Iniciando corre\xE7\xE3o de timezones dos agendamentos...");
  const appointments = await prisma.appointment.findMany({
    where: {
      status: {
        notIn: ["cancelled", "no_show"]
      }
    }
  });
  console.log(
    `\u{1F4CB} Encontrados ${appointments.length} agendamentos para verificar`
  );
  for (const appointment of appointments) {
    const originalStart = (0, import_moment_timezone2.default)(appointment.startTime);
    const originalEnd = (0, import_moment_timezone2.default)(appointment.endTime);
    const correctedStart = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE2);
    const correctedEnd = (0, import_moment_timezone2.default)(appointment.endTime).tz(TIMEZONE2);
    console.log(`\u{1F504} Agendamento ${appointment.id}:`);
    console.log(
      `   Original: ${originalStart.format(
        "DD/MM/YYYY HH:mm"
      )} - ${originalEnd.format("HH:mm")}`
    );
    console.log(
      `   Corrigido: ${correctedStart.format(
        "DD/MM/YYYY HH:mm"
      )} - ${correctedEnd.format("HH:mm")}`
    );
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: correctedStart.toDate(),
        endTime: correctedEnd.toDate()
      }
    });
  }
  console.log("\u2705 Corre\xE7\xE3o de timezones conclu\xEDda!");
}
var createAppointment = async (appointmentData) => {
  const {
    patientId,
    professionalId,
    organizationId,
    startTime,
    endTime,
    notes
  } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const professionalIdString = typeof professionalId === "string" ? professionalId : professionalId.id;
  const organizationIdString = typeof organizationId === "string" ? organizationId : organizationId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const professional = await prisma.users.findUnique({
    where: { id: professionalIdString }
  });
  if (!professional) {
    throw new Error("Profissional n\xE3o encontrado");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationIdString }
  });
  if (!organization) {
    throw new Error("Organiza\xE7\xE3o n\xE3o encontrada");
  }
  await checkSlotAvailability(
    professionalIdString,
    organizationIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const canSchedule = await canPatientScheduleWithProfessional(
    patientIdString,
    professionalIdString,
    new Date(startTime)
  );
  if (!canSchedule.canSchedule) {
    throw new BadRequest(
      canSchedule.reason || "N\xE3o \xE9 poss\xEDvel agendar este hor\xE1rio"
    );
  }
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      professionalId: professionalIdString,
      organizationId: organizationIdString,
      startTime: (0, import_moment_timezone2.default)(startTime).add(3, "hours").toDate(),
      endTime: (0, import_moment_timezone2.default)(endTime).add(3, "hours").toDate(),
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
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
var createAppointmentForAttendant = async (appointmentData) => {
  const {
    patientId,
    professionalId,
    organizationId,
    startTime,
    endTime,
    notes
  } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const professionalIdString = typeof professionalId === "string" ? professionalId : professionalId.id;
  const organizationIdString = typeof organizationId === "string" ? organizationId : organizationId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const professional = await prisma.users.findUnique({
    where: { id: professionalIdString }
  });
  if (!professional) {
    throw new Error("Profissional n\xE3o encontrado");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: organizationIdString }
  });
  if (!organization) {
    throw new Error("Organiza\xE7\xE3o n\xE3o encontrada");
  }
  await checkSlotAvailabilityForAttendant(
    professionalIdString,
    organizationIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const canSchedule = await canPatientScheduleWithProfessional(
    patientIdString,
    professionalIdString,
    new Date(startTime)
  );
  if (!canSchedule.canSchedule) {
    throw new BadRequest(
      canSchedule.reason || "N\xE3o \xE9 poss\xEDvel agendar este hor\xE1rio"
    );
  }
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      professionalId: professionalIdString,
      organizationId: organizationIdString,
      startTime: (0, import_moment_timezone2.default)(startTime).add(3, "hours").toDate(),
      endTime: (0, import_moment_timezone2.default)(endTime).add(3, "hours").toDate(),
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
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
async function checkSlotAvailabilityForAttendant(professionalId, organizationId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone2.default)(startTime).add(3, "hours");
  const localEndTime = (0, import_moment_timezone2.default)(endTime).add(3, "hours");
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE (ATTENDANT): ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = localStartTime.tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      professionalId,
      organizationId,
      dayOfWeek,
      isActive: true
    }
  });
  if (!availability) {
    throw new BadRequest(
      "M\xE9dico n\xE3o possui disponibilidade para este dia da semana"
    );
  }
  const [availStartHour, availStartMin] = availability.startTime.split(":").map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(":").map(Number);
  const availabilityStart = appointmentDate.clone().hour(availStartHour).minute(availStartMin);
  const availabilityEnd = appointmentDate.clone().hour(availEndHour).minute(availEndMin);
  const appointmentStart = localStartTime.tz(TIMEZONE2);
  const appointmentEnd = localEndTime.tz(TIMEZONE2);
  console.log(
    `\u{1F4C5} Disponibilidade do m\xE9dico: ${availabilityStart.format(
      "HH:mm"
    )} - ${availabilityEnd.format("HH:mm")}`
  );
  console.log(
    `\u{1F4C5} Hor\xE1rio solicitado: ${appointmentStart.format(
      "HH:mm"
    )} - ${appointmentEnd.format("HH:mm")}`
  );
  if (appointmentStart.isBefore(availabilityStart) || appointmentEnd.isAfter(availabilityEnd)) {
    throw new BadRequest(
      `Hor\xE1rio fora da disponibilidade do m\xE9dico (${availabilityStart.format(
        "HH:mm"
      )} - ${availabilityEnd.format("HH:mm")})`
    );
  }
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      professionalId,
      organizationId,
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
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (conflictingAppointment) {
    console.log(
      `\u274C CONFLITO ENCONTRADO: Agendamento ID ${conflictingAppointment.id}`
    );
    console.log(
      `   Hor\xE1rio conflitante: ${(0, import_moment_timezone2.default)(conflictingAppointment.startTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone2.default)(conflictingAppointment.endTime).tz(TIMEZONE2).format("HH:mm")}`
    );
    console.log(
      `   Paciente: ${conflictingAppointment.patient.name} (ID: ${conflictingAppointment.patient.id})`
    );
    console.log(`   Status: ${conflictingAppointment.status}`);
    throw new BadRequest("Este hor\xE1rio j\xE1 est\xE1 ocupado");
  }
  console.log(
    `\u2705 HOR\xC1RIO DISPON\xCDVEL: ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
}
var canPatientScheduleWithProfessional = async (patientId, professionalId, requestedDate) => {
  try {
    if (requestedDate) {
      const startOfDay = (0, import_moment_timezone2.default)(requestedDate).startOf("day").toDate();
      const endOfDay = (0, import_moment_timezone2.default)(requestedDate).endOf("day").toDate();
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          professionalId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ["scheduled", "confirmed"]
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          professional: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      if (existingAppointment) {
        return {
          canSchedule: false,
          reason: `Voc\xEA j\xE1 possui um agendamento com ${existingAppointment.professional.name} no dia ${(0, import_moment_timezone2.default)(existingAppointment.startTime).format(
            "DD/MM/YYYY"
          )} \xE0s ${(0, import_moment_timezone2.default)(existingAppointment.startTime).format("HH:mm")}`,
          existingAppointment
        };
      }
    }
    return {
      canSchedule: true
    };
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do paciente:", error);
    return {
      canSchedule: false,
      reason: "Erro ao verificar disponibilidade"
    };
  }
};
function adjustAppointmentTimes(appointments) {
  return appointments.map((appointment) => ({
    ...appointment,
    startTime: appointment.startTime ? (0, import_moment_timezone2.default)(appointment.startTime).subtract(3, "hours").toISOString() : appointment.startTime,
    endTime: appointment.endTime ? (0, import_moment_timezone2.default)(appointment.endTime).subtract(3, "hours").toISOString() : appointment.endTime
  }));
}
async function getPatientAppointments(patientId, organizationId, status) {
  const whereClause = {
    patientId
  };
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }
  if (status) {
    whereClause.status = status;
  }
  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: selectAppointmentWithUsers,
    orderBy: { startTime: "desc" }
  });
  return adjustAppointmentTimes(appointments);
}
async function getProfessionalAppointments(professionalId, organizationId, startDate, endDate) {
  const whereClause = {
    professionalId
  };
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }
  if (startDate && endDate) {
    whereClause.startTime = {
      gte: startDate,
      lte: endDate
    };
  }
  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: selectAppointmentWithUsers,
    orderBy: { startTime: "asc" }
  });
  return adjustAppointmentTimes(appointments);
}
async function updateAppointmentStatus(appointmentId, status, userId, userRole) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      professional: true
    }
  });
  if (!appointment) {
    throw new NotFound("Agendamento n\xE3o encontrado");
  }
  if (userRole === "patient" && appointment.patientId !== userId) {
    throw new Unauthorized(
      "Voc\xEA n\xE3o tem permiss\xE3o para alterar este agendamento"
    );
  }
  if (userRole === "professional" && appointment.professionalId !== userId) {
    throw new Unauthorized(
      "Voc\xEA n\xE3o tem permiss\xE3o para alterar este agendamento"
    );
  }
  if (appointment.status === "completed" || appointment.status === "no_show") {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel alterar o status de um agendamento finalizado"
    );
  }
  if (status === "cancelled") {
    const now = (0, import_moment_timezone2.default)().tz(TIMEZONE2);
    const appointmentTime = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE2);
    const hoursUntilAppointment = appointmentTime.diff(now, "hours");
    if (hoursUntilAppointment < 24) {
      throw new BadRequest(
        "Agendamentos s\xF3 podem ser cancelados com 24h de anteced\xEAncia"
      );
    }
  }
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    select: selectAppointmentWithUsers
  });
  if (status === "cancelled") {
    try {
      await sendAppointmentCancellation(updatedAppointment);
    } catch (error) {
      console.error("Erro ao enviar notifica\xE7\xE3o de cancelamento:", error);
    }
  }
  return updatedAppointment;
}
async function createProfessionalAvailability(professionalId, organizationId, availability) {
  const existingAvailability = await prisma.availability.findUnique({
    where: {
      professionalId_organizationId_dayOfWeek_startTime: {
        professionalId,
        organizationId,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime
      }
    }
  });
  if (existingAvailability) {
    throw new BadRequest(
      "J\xE1 existe disponibilidade configurada para este hor\xE1rio"
    );
  }
  const newAvailability = await prisma.availability.create({
    data: {
      professionalId,
      organizationId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isActive: true
    }
  });
  return newAvailability;
}
async function getProfessionalAvailability(professionalId, organizationId) {
  const whereClause = { professionalId };
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }
  const availabilities = await prisma.availability.findMany({
    where: whereClause,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return availabilities;
}
var getAppointmentById = async (appointmentId) => {
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
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });
    if (!appointment) {
      return null;
    }
    return {
      ...appointment,
      startTime: appointment.startTime ? (0, import_moment_timezone2.default)(appointment.startTime).subtract(3, "hours").toISOString() : appointment.startTime,
      endTime: appointment.endTime ? (0, import_moment_timezone2.default)(appointment.endTime).subtract(3, "hours").toISOString() : appointment.endTime
    };
  } catch (error) {
    console.error("Error fetching appointment by ID:", error);
    return null;
  }
};
async function deleteProfessionalAvailability(availabilityId, professionalId) {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId,
      isActive: true
    }
  });
  if (!availability) {
    throw new NotFound("Disponibilidade n\xE3o encontrada");
  }
  const dayOfWeek = availability.dayOfWeek;
  const startTime = availability.startTime;
  const endTime = availability.endTime;
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      startTime: {
        gte: /* @__PURE__ */ new Date()
      },
      status: {
        in: ["scheduled", "confirmed"]
      }
    }
  });
  const conflictingAppointments = futureAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    const appointmentDayOfWeek = appointmentDate.getDay();
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5);
    return appointmentDayOfWeek === dayOfWeek && appointmentTime >= startTime && appointmentTime < endTime;
  });
  if (conflictingAppointments.length > 0) {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel deletar esta disponibilidade pois existem agendamentos futuros"
    );
  }
  await prisma.availability.delete({
    where: {
      id: availabilityId
    }
  });
  return { message: "Disponibilidade deletada com sucesso" };
}
async function cancelAppointmentByAttendant(appointmentId, attendantId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      professional: true
    }
  });
  if (!appointment) {
    throw new NotFound("Agendamento n\xE3o encontrado");
  }
  if (appointment.status === "completed" || appointment.status === "no_show" || appointment.status === "cancelled") {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel cancelar um agendamento finalizado ou j\xE1 cancelado"
    );
  }
  const now = (0, import_moment_timezone2.default)().tz(TIMEZONE2);
  const appointmentTime = (0, import_moment_timezone2.default)(appointment.startTime).tz(TIMEZONE2);
  if (appointmentTime.isBefore(now)) {
    throw new BadRequest(
      "N\xE3o \xE9 poss\xEDvel cancelar um agendamento que j\xE1 passou"
    );
  }
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
    select: selectAppointmentWithUsers
  });
  try {
    await sendAppointmentCancellation(updatedAppointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de cancelamento:", error);
  }
  return updatedAppointment;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canPatientScheduleWithProfessional,
  cancelAppointmentByAttendant,
  checkSlotAvailability,
  checkSlotAvailabilityForAttendant,
  createAppointment,
  createAppointmentForAttendant,
  createProfessionalAvailability,
  deleteProfessionalAvailability,
  fixAppointmentTimezones,
  generateAvailableSlots,
  getAppointmentById,
  getPatientAppointments,
  getProfessionalAppointments,
  getProfessionalAvailability,
  selectAppointment,
  selectAppointmentWithUsers,
  updateAppointmentStatus
});
