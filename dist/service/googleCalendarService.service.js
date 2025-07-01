"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendarEvent = createCalendarEvent;
exports.updateCalendarEvent = updateCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
exports.getCalendarEvents = getCalendarEvents;
exports.checkCalendarAvailability = checkCalendarAvailability;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const TIMEZONE = "America/Sao_Paulo";
// Configuração do OAuth2
const oauth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET
// process.env.GOOGLE_REDIRECT_URI
);
// Configurar credenciais se existir refresh token
// if (process.env.GOOGLE_REFRESH_TOKEN) {
//   oauth2Client.setCredentials({
//     refresh_token: process.env.GOOGLE_REFRESH_TOKEN
//   });
// }
const calendar = googleapis_1.google.calendar({ version: "v3", auth: oauth2Client });
// Criar evento no Google Calendar
async function createCalendarEvent(event) {
    try {
        const eventData = {
            summary: event.summary,
            description: event.description,
            start: {
                dateTime: (0, moment_timezone_1.default)(event.startTime).tz(TIMEZONE).format(),
                timeZone: TIMEZONE
            },
            end: {
                dateTime: (0, moment_timezone_1.default)(event.endTime).tz(TIMEZONE).format(),
                timeZone: TIMEZONE
            },
            attendees: event.attendees.map((attendee) => ({
                email: attendee.email,
                displayName: attendee.displayName
            })),
            location: event.location,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "email", minutes: 24 * 60 }, // 24 horas antes
                    { method: "popup", minutes: 60 } // 1 hora antes
                ]
            }
        };
        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: eventData
        });
        return {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink
        };
    }
    catch (error) {
        console.error("Erro ao criar evento no Google Calendar:", error);
        // Não vamos lançar erro para não impedir o agendamento
        return null;
    }
}
// Atualizar evento no Google Calendar
async function updateCalendarEvent(eventId, updates) {
    try {
        const eventData = {};
        if (updates.summary)
            eventData.summary = updates.summary;
        if (updates.description)
            eventData.description = updates.description;
        if (updates.startTime && updates.endTime) {
            eventData.start = {
                dateTime: (0, moment_timezone_1.default)(updates.startTime).tz(TIMEZONE).format(),
                timeZone: TIMEZONE
            };
            eventData.end = {
                dateTime: (0, moment_timezone_1.default)(updates.endTime).tz(TIMEZONE).format(),
                timeZone: TIMEZONE
            };
        }
        if (updates.attendees) {
            eventData.attendees = updates.attendees.map((attendee) => ({
                email: attendee.email,
                displayName: attendee.displayName
            }));
        }
        const response = await calendar.events.update({
            calendarId: "primary",
            eventId: eventId,
            requestBody: eventData
        });
        return {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink
        };
    }
    catch (error) {
        console.error("Erro ao atualizar evento no Google Calendar:", error);
        return null;
    }
}
// Deletar evento no Google Calendar
async function deleteCalendarEvent(eventId) {
    try {
        await calendar.events.delete({
            calendarId: "primary",
            eventId: eventId
        });
        return true;
    }
    catch (error) {
        console.error("Erro ao deletar evento no Google Calendar:", error);
        return false;
    }
}
// Buscar eventos do calendário
async function getCalendarEvents(startDate, endDate) {
    try {
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: "startTime"
        });
        return response.data.items || [];
    }
    catch (error) {
        console.error("Erro ao buscar eventos do Google Calendar:", error);
        return [];
    }
}
// Verificar disponibilidade no calendário
async function checkCalendarAvailability(startTime, endTime) {
    try {
        const events = await getCalendarEvents(startTime, endTime);
        // Se não houver eventos, está disponível
        if (!events || events.length === 0)
            return true;
        // Verificar se há conflito com algum evento
        for (const event of events) {
            if (!event.start?.dateTime || !event.end?.dateTime)
                continue;
            const eventStart = new Date(event.start.dateTime);
            const eventEnd = new Date(event.end.dateTime);
            // Verificar sobreposição
            if ((startTime >= eventStart && startTime < eventEnd) ||
                (endTime > eventStart && endTime <= eventEnd) ||
                (startTime <= eventStart && endTime >= eventEnd)) {
                return false;
            }
        }
        return true;
    }
    catch (error) {
        console.error("Erro ao verificar disponibilidade:", error);
        // Em caso de erro, assumimos que está disponível
        return true;
    }
}
//# sourceMappingURL=googleCalendarService.service.js.map