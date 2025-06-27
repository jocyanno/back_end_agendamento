import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import moment from "moment-timezone";

const TIMEZONE = "America/Sao_Paulo";

// Configuração do OAuth2
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // process.env.GOOGLE_REDIRECT_URI
);

// Configurar credenciais se existir refresh token
// if (process.env.GOOGLE_REFRESH_TOKEN) {
//   oauth2Client.setCredentials({
//     refresh_token: process.env.GOOGLE_REFRESH_TOKEN
//   });
// }

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export interface CalendarEvent {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{ email: string; displayName?: string }>;
  location?: string;
  conferenceData?: boolean;
}

// Criar evento no Google Calendar
export async function createCalendarEvent(event: CalendarEvent) {
  try {
    const eventData: any = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: moment(event.startTime).tz(TIMEZONE).format(),
        timeZone: TIMEZONE
      },
      end: {
        dateTime: moment(event.endTime).tz(TIMEZONE).format(),
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

    // Adicionar Google Meet se solicitado
    if (event.conferenceData) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `appointment-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      };
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
      conferenceDataVersion: event.conferenceData ? 1 : 0
    });

    return {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink
    };
  } catch (error) {
    console.error("Erro ao criar evento no Google Calendar:", error);
    // Não vamos lançar erro para não impedir o agendamento
    return null;
  }
}

// Atualizar evento no Google Calendar
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
) {
  try {
    const eventData: any = {};

    if (updates.summary) eventData.summary = updates.summary;
    if (updates.description) eventData.description = updates.description;

    if (updates.startTime && updates.endTime) {
      eventData.start = {
        dateTime: moment(updates.startTime).tz(TIMEZONE).format(),
        timeZone: TIMEZONE
      };
      eventData.end = {
        dateTime: moment(updates.endTime).tz(TIMEZONE).format(),
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
      htmlLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink
    };
  } catch (error) {
    console.error("Erro ao atualizar evento no Google Calendar:", error);
    return null;
  }
}

// Deletar evento no Google Calendar
export async function deleteCalendarEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar evento no Google Calendar:", error);
    return false;
  }
}

// Buscar eventos do calendário
export async function getCalendarEvents(startDate: Date, endDate: Date) {
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime"
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Erro ao buscar eventos do Google Calendar:", error);
    return [];
  }
}

// Verificar disponibilidade no calendário
export async function checkCalendarAvailability(
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const events = await getCalendarEvents(startTime, endTime);

    // Se não houver eventos, está disponível
    if (!events || events.length === 0) return true;

    // Verificar se há conflito com algum evento
    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Verificar sobreposição
      if (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    // Em caso de erro, assumimos que está disponível
    return true;
  }
}
