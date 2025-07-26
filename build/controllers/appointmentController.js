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

// src/controllers/appointmentController.ts
var appointmentController_exports = {};
__export(appointmentController_exports, {
  cancelAppointmentByAttendantController: () => cancelAppointmentByAttendantController,
  checkPatientDoctorAvailability: () => checkPatientDoctorAvailability,
  deleteAvailability: () => deleteAvailability,
  fixAppointmentTimezonesController: () => fixAppointmentTimezonesController,
  getAvailability: () => getAvailability,
  getAvailableSlots: () => getAvailableSlots,
  getAvailableSlotsByPeriod: () => getAvailableSlotsByPeriod,
  getMyAppointments: () => getMyAppointments,
  getTodayAppointments: () => getTodayAppointments,
  getUserAppointments: () => getUserAppointments,
  postAppointment: () => postAppointment,
  postAppointmentForPatient: () => postAppointmentForPatient,
  postAvailability: () => postAvailability,
  putAppointmentStatus: () => putAppointmentStatus
});
module.exports = __toCommonJS(appointmentController_exports);

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
    message: `Seu agendamento com ${appointment.doctor.name} foi confirmado para ${date} \xE0s ${time}`
  });
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
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
    message: `Seu agendamento com ${appointment.doctor.name} para ${date} \xE0s ${time} foi cancelado`
  });
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
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
  doctorId: true,
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
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  }
};
async function checkSlotAvailability(doctorId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone2.default)(startTime).add(3, "hours").toDate();
  const localEndTime = (0, import_moment_timezone2.default)(endTime).add(3, "hours").toDate();
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE: ${(0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone2.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = (0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
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
  const appointmentStart = (0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2);
  const appointmentEnd = (0, import_moment_timezone2.default)(localEndTime).tz(TIMEZONE2);
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
      doctorId,
      status: {
        notIn: ["cancelled", "no_show"]
      },
      OR: [
        {
          AND: [
            { startTime: { lte: localStartTime } },
            { endTime: { gt: localStartTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: localEndTime } },
            { endTime: { gte: localEndTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: localStartTime } },
            { endTime: { lte: localEndTime } }
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
    `\u2705 HOR\xC1RIO DISPON\xCDVEL: ${(0, import_moment_timezone2.default)(localStartTime).tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${(0, import_moment_timezone2.default)(localEndTime).tz(TIMEZONE2).format("HH:mm")}`
  );
}
async function generateAvailableSlots(doctorId, date) {
  console.log(`
=== INICIANDO GERA\xC7\xC3O DE SLOTS ===`);
  console.log(`Data solicitada: ${date}`);
  console.log(`M\xE9dico ID: ${doctorId}`);
  const requestedDate = (0, import_moment_timezone2.default)(date).tz(TIMEZONE2);
  const dayOfWeek = requestedDate.day();
  console.log(`Dia da semana: ${dayOfWeek} (${requestedDate.format("dddd")})`);
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
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
  console.log(`=== AGENDAMENTOS EXISTENTES PARA ${date} ===`);
  console.log(`M\xE9dico ID: ${doctorId}`);
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
  const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorIdString, register: "doctor" }
  });
  if (!doctor) {
    throw new Error("M\xE9dico n\xE3o encontrado");
  }
  await checkSlotAvailability(
    doctorIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      doctorId: doctorIdString,
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
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
var createAppointmentForAttendant = async (appointmentData) => {
  const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
  const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
  const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
  const patient = await prisma.users.findUnique({
    where: { id: patientIdString }
  });
  if (!patient) {
    throw new Error("Paciente n\xE3o encontrado");
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorIdString, register: "doctor" }
  });
  if (!doctor) {
    throw new Error("M\xE9dico n\xE3o encontrado");
  }
  await checkSlotAvailabilityForAttendant(
    doctorIdString,
    new Date(startTime),
    new Date(endTime)
  );
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientIdString,
      doctorId: doctorIdString,
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
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de confirma\xE7\xE3o:", error);
  }
  return appointment;
};
async function checkSlotAvailabilityForAttendant(doctorId, startTime, endTime) {
  const localStartTime = (0, import_moment_timezone2.default)(startTime).add(3, "hours");
  const localEndTime = (0, import_moment_timezone2.default)(endTime).add(3, "hours");
  console.log(
    `\u{1F50D} VERIFICANDO DISPONIBILIDADE (ATTENDANT): ${localStartTime.tz(TIMEZONE2).format("DD/MM/YYYY HH:mm")} - ${localEndTime.tz(TIMEZONE2).format("HH:mm")}`
  );
  const appointmentDate = localStartTime.tz(TIMEZONE2);
  const dayOfWeek = appointmentDate.day();
  const availability = await prisma.availability.findFirst({
    where: {
      doctorId,
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
var canPatientScheduleWithDoctor = async (patientId, doctorId) => {
  try {
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
async function getPatientAppointments(patientId, status) {
  const where = { patientId };
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
  return adjustAppointmentTimes(appointments);
}
async function getDoctorAppointments(doctorId, startDate, endDate) {
  const where = { doctorId };
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
  return adjustAppointmentTimes(appointments);
}
async function updateAppointmentStatus(appointmentId, status, userId, userRole) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true
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
  if (userRole === "doctor" && appointment.doctorId !== userId) {
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
async function createDoctorAvailability(doctorId, availability) {
  const existing = await prisma.availability.findFirst({
    where: {
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      isActive: true
    }
  });
  if (existing) {
    throw new BadRequest(
      "J\xE1 existe disponibilidade configurada para este dia da semana"
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
async function getDoctorAvailability(doctorId) {
  const availabilities = await prisma.availability.findMany({
    where: {
      doctorId,
      isActive: true
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return availabilities;
}
async function deleteDoctorAvailability(availabilityId, doctorId) {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId,
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
      doctorId,
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
      doctor: true
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

// src/controllers/appointmentController.ts
var import_moment_timezone3 = __toESM(require("moment-timezone"));
async function postAppointment(request, reply) {
  const { id: patientId, register } = request.usuario;
  if (register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "M\xE9dicos n\xE3o podem agendar consultas para si mesmos"
    });
  }
  const { doctorId, startTime, notes } = request.body;
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1e3);
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
async function getAvailableSlotsByPeriod(request, reply) {
  try {
    const { startDate, endDate, doctorId } = request.query;
    if (!doctorId) {
      return reply.status(400).send({
        status: "error",
        message: "doctorId \xE9 obrigat\xF3rio"
      });
    }
    const date = (0, import_moment_timezone3.default)(startDate).format("YYYY-MM-DD");
    const slots = await generateAvailableSlots(doctorId, date);
    return reply.status(200).send({
      status: "success",
      data: slots
    });
  } catch (error) {
    console.error("Erro ao buscar hor\xE1rios dispon\xEDveis:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function getAvailableSlots(request, reply) {
  const { doctorId, date } = request.query;
  const slots = await generateAvailableSlots(doctorId, date);
  return reply.status(200).send({
    status: "success",
    data: slots
  });
}
async function getMyAppointments(request, reply) {
  const { id: userId, register } = request.usuario;
  const { status } = request.query;
  let appointments;
  if (register === "doctor") {
    const { startDate, endDate } = request.query;
    const start = startDate ? new Date(startDate) : void 0;
    const end = endDate ? new Date(endDate) : void 0;
    appointments = await getDoctorAppointments(userId, start, end);
  } else {
    appointments = await getPatientAppointments(userId, status);
  }
  return reply.status(200).send({
    status: "success",
    data: appointments
  });
}
async function putAppointmentStatus(request, reply) {
  const { id: appointmentId } = request.params;
  const { status } = request.body;
  const { id: userId, register } = request.usuario;
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
async function postAvailability(request, reply) {
  try {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas m\xE9dicos podem configurar disponibilidade"
      });
    }
    const availability = request.body;
    const created = await createDoctorAvailability(doctorId, availability);
    return reply.status(201).send({
      status: "success",
      data: created
    });
  } catch (error) {
    if (error.message?.includes("J\xE1 existe disponibilidade")) {
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
async function getAvailability(request, reply) {
  const { doctorId } = request.params;
  const availabilities = await getDoctorAvailability(doctorId);
  return reply.status(200).send({
    status: "success",
    data: availabilities
  });
}
async function getTodayAppointments(request, reply) {
  const { id: doctorId, register } = request.usuario;
  if (register !== "doctor") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas m\xE9dicos podem acessar esta rota"
    });
  }
  const today = (0, import_moment_timezone3.default)().tz("America/Sao_Paulo");
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
async function postAppointmentForPatient(request, reply) {
  const { id: currentUserId, register } = request.usuario;
  if (register !== "doctor" && register !== "attendant") {
    return reply.status(403).send({
      status: "error",
      message: "Apenas m\xE9dicos podem criar agendamentos para pacientes"
    });
  }
  const { patientId, doctorId, startTime, notes } = request.body;
  const patient = await prisma.users.findUnique({
    where: { id: patientId },
    select: { id: true, register: true }
  });
  if (!patient) {
    return reply.status(404).send({
      status: "error",
      message: "Paciente n\xE3o encontrado"
    });
  }
  if (patient.register === "doctor") {
    return reply.status(400).send({
      status: "error",
      message: "N\xE3o \xE9 poss\xEDvel agendar consulta para outro m\xE9dico"
    });
  }
  const doctor = await prisma.users.findUnique({
    where: { id: doctorId },
    select: { id: true, register: true }
  });
  if (!doctor || doctor.register !== "doctor") {
    return reply.status(404).send({
      status: "error",
      message: "M\xE9dico n\xE3o encontrado"
    });
  }
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1e3);
  let appointment;
  if (register === "attendant") {
    appointment = await createAppointmentForAttendant({
      patientId,
      doctorId,
      startTime,
      endTime: endDate.toISOString(),
      notes
    });
  } else {
    appointment = await createAppointment({
      patientId,
      doctorId,
      startTime,
      endTime: endDate.toISOString(),
      notes
    });
  }
  return reply.status(201).send({
    status: "success",
    data: appointment
  });
}
async function deleteAvailability(request, reply) {
  try {
    const { id: doctorId, register } = request.usuario;
    if (register !== "doctor") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas m\xE9dicos podem deletar disponibilidade"
      });
    }
    const { availabilityId } = request.params;
    const result = await deleteDoctorAvailability(availabilityId, doctorId);
    return reply.status(200).send({
      status: "success",
      data: result
    });
  } catch (error) {
    if (error.message?.includes("n\xE3o encontrada")) {
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
async function cancelAppointmentByAttendantController(request, reply) {
  try {
    const { id: attendantId, register } = request.usuario;
    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem cancelar agendamentos"
      });
    }
    const { appointmentId } = request.params;
    const cancelledAppointment = await cancelAppointmentByAttendant(
      appointmentId,
      attendantId
    );
    return reply.status(200).send({
      status: "success",
      data: cancelledAppointment
    });
  } catch (error) {
    if (error.message?.includes("n\xE3o encontrado")) {
      return reply.status(404).send({
        status: "error",
        message: error.message
      });
    }
    if (error.message?.includes("N\xE3o \xE9 poss\xEDvel cancelar")) {
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
async function getUserAppointments(request, reply) {
  try {
    const { id: attendantId, register } = request.usuario;
    if (register !== "attendant") {
      return reply.status(403).send({
        status: "error",
        message: "Apenas atendentes podem acessar esta rota"
      });
    }
    const { userId } = request.params;
    const { status } = request.query;
    const appointments = await getPatientAppointments(userId, status);
    return reply.status(200).send({
      status: "success",
      data: appointments
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos do usu\xE1rio:", error);
    return reply.status(500).send({
      status: "error",
      message: "Erro interno do servidor"
    });
  }
}
async function checkPatientDoctorAvailability(request, reply) {
  try {
    const { patientId, doctorId } = request.params;
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
async function fixAppointmentTimezonesController(request, reply) {
  try {
    await fixAppointmentTimezones();
    return reply.status(200).send({
      status: "success",
      message: "Timezones dos agendamentos corrigidos com sucesso"
    });
  } catch (error) {
    console.error("Erro ao corrigir timezones:", error);
    return reply.status(500).send({
      status: "error",
      message: error.message || "Erro interno do servidor"
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cancelAppointmentByAttendantController,
  checkPatientDoctorAvailability,
  deleteAvailability,
  fixAppointmentTimezonesController,
  getAvailability,
  getAvailableSlots,
  getAvailableSlotsByPeriod,
  getMyAppointments,
  getTodayAppointments,
  getUserAppointments,
  postAppointment,
  postAppointmentForPatient,
  postAvailability,
  putAppointmentStatus
});
