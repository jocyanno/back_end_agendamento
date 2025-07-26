"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppointmentById = exports.canPatientScheduleWithDoctor = exports.createAppointmentForAttendant = exports.createAppointment = exports.selectAppointmentWithUsers = exports.selectAppointment = void 0;
exports.checkSlotAvailability = checkSlotAvailability;
exports.generateAvailableSlots = generateAvailableSlots;
exports.fixAppointmentTimezones = fixAppointmentTimezones;
exports.checkSlotAvailabilityForAttendant = checkSlotAvailabilityForAttendant;
exports.getPatientAppointments = getPatientAppointments;
exports.getDoctorAppointments = getDoctorAppointments;
exports.updateAppointmentStatus = updateAppointmentStatus;
exports.createDoctorAvailability = createDoctorAvailability;
exports.getDoctorAvailability = getDoctorAvailability;
exports.deleteDoctorAvailability = deleteDoctorAvailability;
exports.cancelAppointmentByAttendant = cancelAppointmentByAttendant;
const prisma_1 = require("../lib/prisma");
const bad_request_1 = require("../_errors/bad-request");
const not_found_1 = require("../_errors/not-found");
const unauthorized_1 = require("../_errors/unauthorized");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const notificationService_service_1 = require("../service/notificationService.service");
const TIMEZONE = "America/Sao_Paulo";
const SESSION_DURATION_MINUTES = 50;
const BREAK_DURATION_MINUTES = 10;
const START_HOUR = 7;
const START_MINUTE = 30;
const END_HOUR = 20;
exports.selectAppointment = {
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
exports.selectAppointmentWithUsers = {
    ...exports.selectAppointment,
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
// Verificar se o horário está disponível
async function checkSlotAvailability(doctorId, startTime, endTime) {
    // Converter para horário local (adicionar 3 horas)
    const localStartTime = (0, moment_timezone_1.default)(startTime).add(3, "hours").toDate();
    const localEndTime = (0, moment_timezone_1.default)(endTime).add(3, "hours").toDate();
    console.log(`🔍 VERIFICANDO DISPONIBILIDADE: ${(0, moment_timezone_1.default)(localStartTime)
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")} - ${(0, moment_timezone_1.default)(localEndTime)
        .tz(TIMEZONE)
        .format("HH:mm")}`);
    // Verificar se o horário está dentro da disponibilidade do médico
    const appointmentDate = (0, moment_timezone_1.default)(localStartTime).tz(TIMEZONE);
    const dayOfWeek = appointmentDate.day();
    const availability = await prisma_1.prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek,
            isActive: true
        }
    });
    if (!availability) {
        throw new bad_request_1.BadRequest("Médico não possui disponibilidade para este dia da semana");
    }
    const [availStartHour, availStartMin] = availability.startTime
        .split(":")
        .map(Number);
    const [availEndHour, availEndMin] = availability.endTime
        .split(":")
        .map(Number);
    const availabilityStart = appointmentDate
        .clone()
        .hour(availStartHour)
        .minute(availStartMin);
    const availabilityEnd = appointmentDate
        .clone()
        .hour(availEndHour)
        .minute(availEndMin);
    const appointmentStart = (0, moment_timezone_1.default)(localStartTime).tz(TIMEZONE);
    const appointmentEnd = (0, moment_timezone_1.default)(localEndTime).tz(TIMEZONE);
    console.log(`📅 Disponibilidade do médico: ${availabilityStart.format("HH:mm")} - ${availabilityEnd.format("HH:mm")}`);
    console.log(`📅 Horário solicitado: ${appointmentStart.format("HH:mm")} - ${appointmentEnd.format("HH:mm")}`);
    // Verificar se o agendamento está dentro da disponibilidade
    if (appointmentStart.isBefore(availabilityStart) ||
        appointmentEnd.isAfter(availabilityEnd)) {
        throw new bad_request_1.BadRequest(`Horário fora da disponibilidade do médico (${availabilityStart.format("HH:mm")} - ${availabilityEnd.format("HH:mm")})`);
    }
    const conflictingAppointment = await prisma_1.prisma.appointment.findFirst({
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
        console.log(`❌ CONFLITO ENCONTRADO: Agendamento ID ${conflictingAppointment.id}`);
        console.log(`   Horário conflitante: ${(0, moment_timezone_1.default)(conflictingAppointment.startTime)
            .tz(TIMEZONE)
            .format("DD/MM/YYYY HH:mm")} - ${(0, moment_timezone_1.default)(conflictingAppointment.endTime)
            .tz(TIMEZONE)
            .format("HH:mm")}`);
        console.log(`   Paciente: ${conflictingAppointment.patient.name} (ID: ${conflictingAppointment.patient.id})`);
        console.log(`   Status: ${conflictingAppointment.status}`);
        throw new bad_request_1.BadRequest("Este horário já está ocupado");
    }
    console.log(`✅ HORÁRIO DISPONÍVEL: ${(0, moment_timezone_1.default)(localStartTime)
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")} - ${(0, moment_timezone_1.default)(localEndTime)
        .tz(TIMEZONE)
        .format("HH:mm")}`);
}
// Função para debug dos horários
function debugSlotGeneration(requestedDate, availability, now, isToday, currentSlot) {
    console.log("=== DEBUG SLOT GENERATION ===");
    console.log("Data solicitada:", requestedDate.format("DD/MM/YYYY"));
    console.log("Horário atual:", now.format("DD/MM/YYYY HH:mm"));
    console.log("É hoje?", isToday);
    console.log("Disponibilidade médico:", availability.startTime, "-", availability.endTime);
    console.log("Primeiro slot calculado:", currentSlot.format("DD/MM/YYYY HH:mm"));
    console.log("Timezone:", TIMEZONE);
    console.log("================================");
}
// Gerar slots disponíveis para um dia
async function generateAvailableSlots(doctorId, date) {
    console.log(`\n=== INICIANDO GERAÇÃO DE SLOTS ===`);
    console.log(`Data solicitada: ${date}`);
    console.log(`Médico ID: ${doctorId}`);
    const requestedDate = (0, moment_timezone_1.default)(date).tz(TIMEZONE);
    const dayOfWeek = requestedDate.day();
    console.log(`Dia da semana: ${dayOfWeek} (${requestedDate.format("dddd")})`);
    // Buscar disponibilidade do médico para o dia da semana
    const availability = await prisma_1.prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek,
            isActive: true
        }
    });
    console.log(`Disponibilidade encontrada:`, availability ? "SIM" : "NÃO");
    if (availability) {
        console.log(`   Horário: ${availability.startTime} - ${availability.endTime}`);
        console.log(`   ID: ${availability.id}`);
    }
    if (!availability) {
        console.log(`❌ NENHUMA DISPONIBILIDADE CONFIGURADA PARA ESTE DIA`);
        console.log(`=== FIM GERAÇÃO DE SLOTS ===\n`);
        return [];
    }
    // Buscar agendamentos existentes no dia
    const startOfDay = requestedDate.clone().startOf("day").toDate();
    const endOfDay = requestedDate.clone().endOf("day").toDate();
    console.log(`🔍 Buscando agendamentos entre: ${(0, moment_timezone_1.default)(startOfDay)
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")} e ${(0, moment_timezone_1.default)(endOfDay)
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")}`);
    const existingAppointments = await prisma_1.prisma.appointment.findMany({
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
    // Debug: Log dos agendamentos existentes
    console.log(`=== AGENDAMENTOS EXISTENTES PARA ${date} ===`);
    console.log(`Médico ID: ${doctorId}`);
    console.log(`Total de agendamentos: ${existingAppointments.length}`);
    existingAppointments.forEach((appointment, index) => {
        console.log(`${index + 1}. ${(0, moment_timezone_1.default)(appointment.startTime)
            .tz(TIMEZONE)
            .format("HH:mm")} - ${(0, moment_timezone_1.default)(appointment.endTime)
            .tz(TIMEZONE)
            .format("HH:mm")} (${appointment.status})`);
    });
    console.log("==========================================");
    // Gerar slots baseados na disponibilidade
    const slots = [];
    const [availStartHour, availStartMin] = availability.startTime
        .split(":")
        .map(Number);
    const [availEndHour, availEndMin] = availability.endTime
        .split(":")
        .map(Number);
    console.log(`\n📅 CONFIGURAÇÃO DE HORÁRIOS:`);
    console.log(`   Início disponibilidade: ${availStartHour}:${availStartMin
        .toString()
        .padStart(2, "0")}`);
    console.log(`   Fim disponibilidade: ${availEndHour}:${availEndMin
        .toString()
        .padStart(2, "0")}`);
    console.log(`   Duração da sessão: ${SESSION_DURATION_MINUTES} minutos`);
    console.log(`   Intervalo entre sessões: ${BREAK_DURATION_MINUTES} minutos`);
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
    const now = (0, moment_timezone_1.default)().tz(TIMEZONE);
    const isToday = requestedDate.isSame(now, "day");
    console.log(`\n⏰ VERIFICAÇÃO DE HORÁRIO:`);
    console.log(`   É hoje? ${isToday}`);
    console.log(`   Horário atual: ${now.format("HH:mm")}`);
    console.log(`   Primeiro slot calculado: ${currentSlot.format("HH:mm")}`);
    if (isToday && currentSlot.isBefore(now)) {
        // Começar pelo próximo horário redondo disponível
        const currentHour = now.hour();
        const currentMinute = now.minute();
        // Se já passou dos minutos, ir para a próxima hora
        if (currentMinute > 0) {
            currentSlot = now.clone().add(1, "hour").startOf("hour");
        }
        else {
            currentSlot = now.clone().startOf("hour");
        }
        // Garantir que o slot está dentro da disponibilidade do médico
        if (currentSlot.hour() < startHour ||
            (currentSlot.hour() === startHour && currentSlot.minute() < startMin)) {
            currentSlot = requestedDate.clone().hour(startHour).minute(startMin);
        }
        console.log(`   ⚠️  Horário ajustado para: ${currentSlot.format("HH:mm")}`);
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
    console.log(`\n🔄 INICIANDO LOOP DE GERAÇÃO DE SLOTS:`);
    console.log(`   Horário de fim da disponibilidade: ${availEndTime.format("HH:mm")}`);
    console.log(`   Horário de fim do serviço: ${serviceEndTime.format("HH:mm")}`);
    console.log(`   Horário de fim usado: ${endTime.format("HH:mm")}`);
    console.log(`   Slot inicial: ${currentSlot.format("HH:mm")}`);
    let slotCount = 0;
    while (currentSlot.isBefore(endTime)) {
        slotCount++;
        const slotEnd = currentSlot
            .clone()
            .add(SESSION_DURATION_MINUTES, "minutes");
        console.log(`\n   📍 Slot ${slotCount}: ${currentSlot.format("HH:mm")} - ${slotEnd.format("HH:mm")}`);
        // Verificar se o slot não conflita com agendamentos existentes
        const conflictingAppointment = existingAppointments.find((appointment) => {
            const appointmentStart = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE);
            const appointmentEnd = (0, moment_timezone_1.default)(appointment.endTime).tz(TIMEZONE);
            // Verificar se há sobreposição de horários
            // O slot está disponível se:
            // 1. O slot termina antes do início do agendamento, OU
            // 2. O slot começa depois do fim do agendamento
            const slotEndsBeforeAppointment = slotEnd.isSameOrBefore(appointmentStart);
            const slotStartsAfterAppointment = currentSlot.isSameOrAfter(appointmentEnd);
            // Se NÃO há sobreposição, o slot está disponível
            return !(slotEndsBeforeAppointment || slotStartsAfterAppointment);
        });
        const isAvailable = !conflictingAppointment;
        // Debug: Log de slots conflitantes
        if (!isAvailable && conflictingAppointment) {
            console.log(`     ❌ CONFLITO: Conflita com agendamento ${conflictingAppointment.id}`);
            console.log(`        Agendamento: ${(0, moment_timezone_1.default)(conflictingAppointment.startTime).format("HH:mm")} - ${(0, moment_timezone_1.default)(conflictingAppointment.endTime).format("HH:mm")}`);
        }
        // Verificar se o slot não está no passado
        // Se for hoje, verificar se o horário já passou
        // Se for dia futuro, todos os horários são válidos
        const isPastSlot = isToday && currentSlot.isBefore(now);
        if (isPastSlot) {
            console.log(`     ⏰ PASSADO: Slot já passou`);
        }
        console.log(`     Status: ${isAvailable && !isPastSlot ? "✅ DISPONÍVEL" : "❌ INDISPONÍVEL"}`);
        if (isAvailable && !isPastSlot && slotEnd.isSameOrBefore(endTime)) {
            // Criar horário UTC com o valor do horário brasileiro
            // Exemplo: 08:00 BRT vira 08:00 UTC (não 11:00 UTC)
            const startTimeUTC = moment_timezone_1.default
                .utc()
                .year(currentSlot.year())
                .month(currentSlot.month())
                .date(currentSlot.date())
                .hour(currentSlot.hour())
                .minute(currentSlot.minute())
                .second(0)
                .millisecond(0);
            const endTimeUTC = moment_timezone_1.default
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
            // Debug: Log de slots disponíveis
            console.log(`✅ SLOT DISPONÍVEL: ${currentSlot.format("HH:mm")} - ${slotEnd.format("HH:mm")}`);
        }
        // Próximo slot (sessão + intervalo)
        currentSlot.add(SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES, "minutes");
    }
    // Os slots são retornados em formato UTC mas com horário brasileiro
    // Exemplo: 08:00 BRT = 08:00 UTC (2025-07-03T08:00:00.000Z)
    // Debug: Resumo final
    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`   Total de slots verificados: ${slotCount}`);
    console.log(`   Slots disponíveis gerados: ${slots.length}`);
    console.log(`   Slots disponíveis:`, slots.map((slot) => (0, moment_timezone_1.default)(slot.startTime).format("HH:mm")).join(", "));
    console.log(`=== FIM GERAÇÃO DE SLOTS ===\n`);
    return slots;
}
// Função para corrigir agendamentos com timezone incorreto (usar apenas uma vez)
async function fixAppointmentTimezones() {
    console.log("🔧 Iniciando correção de timezones dos agendamentos...");
    const appointments = await prisma_1.prisma.appointment.findMany({
        where: {
            status: {
                notIn: ["cancelled", "no_show"]
            }
        }
    });
    console.log(`📋 Encontrados ${appointments.length} agendamentos para verificar`);
    for (const appointment of appointments) {
        const originalStart = (0, moment_timezone_1.default)(appointment.startTime);
        const originalEnd = (0, moment_timezone_1.default)(appointment.endTime);
        // Se o horário está em UTC (3 horas a menos), corrigir para BRT
        const correctedStart = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE);
        const correctedEnd = (0, moment_timezone_1.default)(appointment.endTime).tz(TIMEZONE);
        console.log(`🔄 Agendamento ${appointment.id}:`);
        console.log(`   Original: ${originalStart.format("DD/MM/YYYY HH:mm")} - ${originalEnd.format("HH:mm")}`);
        console.log(`   Corrigido: ${correctedStart.format("DD/MM/YYYY HH:mm")} - ${correctedEnd.format("HH:mm")}`);
        // Atualizar no banco
        await prisma_1.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                startTime: correctedStart.toDate(),
                endTime: correctedEnd.toDate()
            }
        });
    }
    console.log("✅ Correção de timezones concluída!");
}
// Criar agendamento
const createAppointment = async (appointmentData) => {
    const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
    // Verificar se é string (corrigir se vier objeto)
    const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
    const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
    // Validar se patient existe
    const patient = await prisma_1.prisma.users.findUnique({
        where: { id: patientIdString }
    });
    if (!patient) {
        throw new Error("Paciente não encontrado");
    }
    // Validar se doctor existe
    const doctor = await prisma_1.prisma.users.findUnique({
        where: { id: doctorIdString, register: "doctor" }
    });
    if (!doctor) {
        throw new Error("Médico não encontrado");
    }
    // Verificar conflito de horário
    await checkSlotAvailability(doctorIdString, new Date(startTime), new Date(endTime));
    // Criar o agendamento
    const appointment = await prisma_1.prisma.appointment.create({
        data: {
            patientId: patientIdString,
            doctorId: doctorIdString,
            startTime: (0, moment_timezone_1.default)(startTime).add(3, "hours").toDate(),
            endTime: (0, moment_timezone_1.default)(endTime).add(3, "hours").toDate(),
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
        await (0, notificationService_service_1.sendAppointmentConfirmation)(appointment);
    }
    catch (error) {
        console.error("Erro ao enviar notificação de confirmação:", error);
    }
    return appointment;
};
exports.createAppointment = createAppointment;
// Criar agendamento para atendente (sem adicionar 3 horas)
const createAppointmentForAttendant = async (appointmentData) => {
    const { patientId, doctorId, startTime, endTime, notes } = appointmentData;
    // Verificar se é string (corrigir se vier objeto)
    const patientIdString = typeof patientId === "string" ? patientId : patientId.id;
    const doctorIdString = typeof doctorId === "string" ? doctorId : doctorId.id;
    // Validar se patient existe
    const patient = await prisma_1.prisma.users.findUnique({
        where: { id: patientIdString }
    });
    if (!patient) {
        throw new Error("Paciente não encontrado");
    }
    // Validar se doctor existe
    const doctor = await prisma_1.prisma.users.findUnique({
        where: { id: doctorIdString, register: "doctor" }
    });
    if (!doctor) {
        throw new Error("Médico não encontrado");
    }
    // Verificar conflito de horário (sem adicionar 3 horas)
    await checkSlotAvailabilityForAttendant(doctorIdString, new Date(startTime), new Date(endTime));
    // Criar o agendamento (sem adicionar 3 horas)
    const appointment = await prisma_1.prisma.appointment.create({
        data: {
            patientId: patientIdString,
            doctorId: doctorIdString,
            startTime: (0, moment_timezone_1.default)(startTime).add(3, "hours").toDate(),
            endTime: (0, moment_timezone_1.default)(endTime).add(3, "hours").toDate(),
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
    // Enviar notificação de confirmação (sistema próprio)
    try {
        await (0, notificationService_service_1.sendAppointmentConfirmation)(appointment);
    }
    catch (error) {
        console.error("Erro ao enviar notificação de confirmação:", error);
    }
    return appointment;
};
exports.createAppointmentForAttendant = createAppointmentForAttendant;
// Verificar disponibilidade para atendente (sem adicionar 3 horas)
async function checkSlotAvailabilityForAttendant(doctorId, startTime, endTime) {
    // O frontend envia horário local como se fosse UTC, então precisamos adicionar 3 horas
    const localStartTime = (0, moment_timezone_1.default)(startTime).add(3, "hours");
    const localEndTime = (0, moment_timezone_1.default)(endTime).add(3, "hours");
    console.log(`🔍 VERIFICANDO DISPONIBILIDADE (ATTENDANT): ${localStartTime
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")} - ${localEndTime
        .tz(TIMEZONE)
        .format("HH:mm")}`);
    // Verificar se o horário está dentro da disponibilidade do médico
    const appointmentDate = localStartTime.tz(TIMEZONE);
    const dayOfWeek = appointmentDate.day();
    const availability = await prisma_1.prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek,
            isActive: true
        }
    });
    if (!availability) {
        throw new bad_request_1.BadRequest("Médico não possui disponibilidade para este dia da semana");
    }
    const [availStartHour, availStartMin] = availability.startTime
        .split(":")
        .map(Number);
    const [availEndHour, availEndMin] = availability.endTime
        .split(":")
        .map(Number);
    const availabilityStart = appointmentDate
        .clone()
        .hour(availStartHour)
        .minute(availStartMin);
    const availabilityEnd = appointmentDate
        .clone()
        .hour(availEndHour)
        .minute(availEndMin);
    const appointmentStart = localStartTime.tz(TIMEZONE);
    const appointmentEnd = localEndTime.tz(TIMEZONE);
    console.log(`📅 Disponibilidade do médico: ${availabilityStart.format("HH:mm")} - ${availabilityEnd.format("HH:mm")}`);
    console.log(`📅 Horário solicitado: ${appointmentStart.format("HH:mm")} - ${appointmentEnd.format("HH:mm")}`);
    // Verificar se o agendamento está dentro da disponibilidade
    if (appointmentStart.isBefore(availabilityStart) ||
        appointmentEnd.isAfter(availabilityEnd)) {
        throw new bad_request_1.BadRequest(`Horário fora da disponibilidade do médico (${availabilityStart.format("HH:mm")} - ${availabilityEnd.format("HH:mm")})`);
    }
    const conflictingAppointment = await prisma_1.prisma.appointment.findFirst({
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
        console.log(`❌ CONFLITO ENCONTRADO: Agendamento ID ${conflictingAppointment.id}`);
        console.log(`   Horário conflitante: ${(0, moment_timezone_1.default)(conflictingAppointment.startTime)
            .tz(TIMEZONE)
            .format("DD/MM/YYYY HH:mm")} - ${(0, moment_timezone_1.default)(conflictingAppointment.endTime)
            .tz(TIMEZONE)
            .format("HH:mm")}`);
        console.log(`   Paciente: ${conflictingAppointment.patient.name} (ID: ${conflictingAppointment.patient.id})`);
        console.log(`   Status: ${conflictingAppointment.status}`);
        throw new bad_request_1.BadRequest("Este horário já está ocupado");
    }
    console.log(`✅ HORÁRIO DISPONÍVEL: ${localStartTime
        .tz(TIMEZONE)
        .format("DD/MM/YYYY HH:mm")} - ${localEndTime
        .tz(TIMEZONE)
        .format("HH:mm")}`);
}
// Verificar se o paciente pode agendar com um profissional específico
const canPatientScheduleWithDoctor = async (patientId, doctorId) => {
    try {
        // ✅ SEMPRE PERMITE AGENDAMENTO - Restrição removida
        return {
            canSchedule: true
        };
    }
    catch (error) {
        console.error("Erro ao verificar disponibilidade do paciente:", error);
        return {
            canSchedule: false,
            reason: "Erro ao verificar disponibilidade"
        };
    }
};
exports.canPatientScheduleWithDoctor = canPatientScheduleWithDoctor;
// Função para ajustar horários dos agendamentos (subtrair 3 horas)
function adjustAppointmentTimes(appointments) {
    return appointments.map((appointment) => ({
        ...appointment,
        startTime: appointment.startTime
            ? (0, moment_timezone_1.default)(appointment.startTime).subtract(3, "hours").toISOString()
            : appointment.startTime,
        endTime: appointment.endTime
            ? (0, moment_timezone_1.default)(appointment.endTime).subtract(3, "hours").toISOString()
            : appointment.endTime
    }));
}
// Buscar agendamentos do paciente
async function getPatientAppointments(patientId, status) {
    const where = { patientId };
    if (status) {
        where.status = status;
    }
    const appointments = await prisma_1.prisma.appointment.findMany({
        where,
        select: exports.selectAppointmentWithUsers,
        orderBy: {
            startTime: "desc"
        }
    });
    // Ajustar horários antes de retornar
    return adjustAppointmentTimes(appointments);
}
// Buscar agendamentos do médico
async function getDoctorAppointments(doctorId, startDate, endDate) {
    const where = { doctorId };
    if (startDate && endDate) {
        where.startTime = {
            gte: startDate,
            lte: endDate
        };
    }
    const appointments = await prisma_1.prisma.appointment.findMany({
        where,
        select: exports.selectAppointmentWithUsers,
        orderBy: {
            startTime: "asc"
        }
    });
    // Ajustar horários antes de retornar
    return adjustAppointmentTimes(appointments);
}
// Atualizar status do agendamento
async function updateAppointmentStatus(appointmentId, status, userId, userRole) {
    const appointment = await prisma_1.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            patient: true,
            doctor: true
        }
    });
    if (!appointment) {
        throw new not_found_1.NotFound("Agendamento não encontrado");
    }
    // Verificar permissões
    if (userRole === "patient" && appointment.patientId !== userId) {
        throw new unauthorized_1.Unauthorized("Você não tem permissão para alterar este agendamento");
    }
    if (userRole === "doctor" && appointment.doctorId !== userId) {
        throw new unauthorized_1.Unauthorized("Você não tem permissão para alterar este agendamento");
    }
    // Regras de negócio para mudança de status
    if (appointment.status === "completed" || appointment.status === "no_show") {
        throw new bad_request_1.BadRequest("Não é possível alterar o status de um agendamento finalizado");
    }
    if (status === "cancelled") {
        const now = (0, moment_timezone_1.default)().tz(TIMEZONE);
        const appointmentTime = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE);
        const hoursUntilAppointment = appointmentTime.diff(now, "hours");
        if (hoursUntilAppointment < 24) {
            throw new bad_request_1.BadRequest("Agendamentos só podem ser cancelados com 24h de antecedência");
        }
    }
    const updatedAppointment = await prisma_1.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status },
        select: exports.selectAppointmentWithUsers
    });
    // Enviar notificação de cancelamento se for cancelamento
    if (status === "cancelled") {
        try {
            await (0, notificationService_service_1.sendAppointmentCancellation)(updatedAppointment);
        }
        catch (error) {
            console.error("Erro ao enviar notificação de cancelamento:", error);
        }
    }
    return updatedAppointment;
}
// Criar disponibilidade do médico
async function createDoctorAvailability(doctorId, availability) {
    // Verificar se já existe disponibilidade para este dia
    const existing = await prisma_1.prisma.availability.findFirst({
        where: {
            doctorId,
            dayOfWeek: availability.dayOfWeek,
            isActive: true
        }
    });
    if (existing) {
        throw new bad_request_1.BadRequest("Já existe disponibilidade configurada para este dia da semana");
    }
    const created = await prisma_1.prisma.availability.create({
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
async function getDoctorAvailability(doctorId) {
    const availabilities = await prisma_1.prisma.availability.findMany({
        where: {
            doctorId,
            isActive: true
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });
    return availabilities;
}
const getAppointmentById = async (appointmentId) => {
    try {
        const appointment = await prisma_1.prisma.appointment.findUnique({
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
        if (!appointment) {
            return null;
        }
        // Ajustar horários antes de retornar
        return {
            ...appointment,
            startTime: appointment.startTime
                ? (0, moment_timezone_1.default)(appointment.startTime).subtract(3, "hours").toISOString()
                : appointment.startTime,
            endTime: appointment.endTime
                ? (0, moment_timezone_1.default)(appointment.endTime).subtract(3, "hours").toISOString()
                : appointment.endTime
        };
    }
    catch (error) {
        console.error("Error fetching appointment by ID:", error);
        return null;
    }
};
exports.getAppointmentById = getAppointmentById;
// Deletar disponibilidade do médico
async function deleteDoctorAvailability(availabilityId, doctorId) {
    // Verificar se a disponibilidade existe e pertence ao médico
    const availability = await prisma_1.prisma.availability.findFirst({
        where: {
            id: availabilityId,
            doctorId,
            isActive: true
        }
    });
    if (!availability) {
        throw new not_found_1.NotFound("Disponibilidade não encontrada");
    }
    // Verificar se existem agendamentos futuros para esta disponibilidade
    const dayOfWeek = availability.dayOfWeek;
    const startTime = availability.startTime;
    const endTime = availability.endTime;
    // Buscar agendamentos futuros que possam estar usando esta disponibilidade
    const futureAppointments = await prisma_1.prisma.appointment.findMany({
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
        return (appointmentDayOfWeek === dayOfWeek &&
            appointmentTime >= startTime &&
            appointmentTime < endTime);
    });
    if (conflictingAppointments.length > 0) {
        throw new bad_request_1.BadRequest("Não é possível deletar esta disponibilidade pois existem agendamentos futuros");
    }
    // Deletar a disponibilidade
    await prisma_1.prisma.availability.delete({
        where: {
            id: availabilityId
        }
    });
    return { message: "Disponibilidade deletada com sucesso" };
}
// Cancelar agendamento (attendant)
async function cancelAppointmentByAttendant(appointmentId, attendantId) {
    const appointment = await prisma_1.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            patient: true,
            doctor: true
        }
    });
    if (!appointment) {
        throw new not_found_1.NotFound("Agendamento não encontrado");
    }
    // Verificar se o agendamento pode ser cancelado
    if (appointment.status === "completed" ||
        appointment.status === "no_show" ||
        appointment.status === "cancelled") {
        throw new bad_request_1.BadRequest("Não é possível cancelar um agendamento finalizado ou já cancelado");
    }
    // Verificar se o agendamento é futuro
    const now = (0, moment_timezone_1.default)().tz(TIMEZONE);
    const appointmentTime = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE);
    if (appointmentTime.isBefore(now)) {
        throw new bad_request_1.BadRequest("Não é possível cancelar um agendamento que já passou");
    }
    // Verificar se o attendant tem permissão (pode cancelar qualquer agendamento)
    // Esta verificação pode ser expandida para verificar se o attendant trabalha com o médico específico
    const updatedAppointment = await prisma_1.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "cancelled" },
        select: exports.selectAppointmentWithUsers
    });
    // Enviar notificação de cancelamento
    try {
        await (0, notificationService_service_1.sendAppointmentCancellation)(updatedAppointment);
    }
    catch (error) {
        console.error("Erro ao enviar notificação de cancelamento:", error);
    }
    return updatedAppointment;
}
//# sourceMappingURL=appointmentService.service.js.map