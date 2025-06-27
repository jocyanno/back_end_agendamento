import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

const TIMEZONE = "America/Sao_Paulo";

// Configurar transporter do nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Enviar email
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Sistema de Agendamento" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log("Email enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

// Template de email para confirmação de agendamento
export function getAppointmentConfirmationTemplate(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Confirmação de Agendamento</h2>
      <p>Olá ${data.patientName},</p>
      <p>Seu agendamento foi confirmado com sucesso!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Horário:</strong> ${data.time}</p>
        ${
          data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ""
        }
        ${
          data.meetLink
            ? `<p><strong>Link da Reunião:</strong> <a href="${data.meetLink}">${data.meetLink}</a></p>`
            : ""
        }
      </div>
      
      <p><strong>Importante:</strong> Caso precise cancelar, faça isso com pelo menos 24 horas de antecedência.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}

// Template de email para lembrete
export function getAppointmentReminderTemplate(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  hoursUntil: number;
  location?: string;
  meetLink?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Lembrete de Agendamento</h2>
      <p>Olá ${data.patientName},</p>
      <p>Este é um lembrete de que você tem um agendamento em ${
        data.hoursUntil
      } horas.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Horário:</strong> ${data.time}</p>
        ${
          data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ""
        }
        ${
          data.meetLink
            ? `<p><strong>Link da Reunião:</strong> <a href="${data.meetLink}">${data.meetLink}</a></p>`
            : ""
        }
      </div>
      
      <p>Por favor, chegue com alguns minutos de antecedência.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}

// Template de email para cancelamento
export function getAppointmentCancellationTemplate(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Agendamento Cancelado</h2>
      <p>Olá ${data.patientName},</p>
      <p>Informamos que seu agendamento foi cancelado.</p>
      
      <div style="background-color: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detalhes do Agendamento Cancelado:</h3>
        <p><strong>Profissional:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${data.date}</p>
        <p><strong>Horário:</strong> ${data.time}</p>
        ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}
      </div>
      
      <p>Se desejar, você pode agendar um novo horário através do nosso sistema.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}

// Criar notificação no banco de dados
export async function createNotification(data: {
  userId: string;
  appointmentId?: string;
  type: string;
  title: string;
  message: string;
}) {
  return await prisma.notification.create({
    data
  });
}

// Enviar notificação de confirmação
export async function sendAppointmentConfirmation(appointment: any) {
  const date = moment(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = moment(appointment.startTime).tz(TIMEZONE).format("HH:mm");

  // Criar notificação no banco
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "confirmation",
    title: "Agendamento Confirmado",
    message: `Seu agendamento com ${appointment.doctor.name} foi confirmado para ${date} às ${time}`
  });

  // Enviar email
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
    date,
    time,
    meetLink: appointment.googleMeetLink
  });

  await sendEmail(
    appointment.patient.email,
    "Confirmação de Agendamento",
    emailHtml
  );
}

// Enviar lembrete de agendamento
export async function sendAppointmentReminder(appointment: any) {
  const now = moment().tz(TIMEZONE);
  const appointmentTime = moment(appointment.startTime).tz(TIMEZONE);
  const hoursUntil = appointmentTime.diff(now, "hours");

  const date = appointmentTime.format("DD/MM/YYYY");
  const time = appointmentTime.format("HH:mm");

  // Criar notificação no banco
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "reminder",
    title: "Lembrete de Agendamento",
    message: `Lembrete: Você tem um agendamento em ${hoursUntil} horas com ${appointment.doctor.name}`
  });

  // Enviar email
  const emailHtml = getAppointmentReminderTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
    date,
    time,
    hoursUntil,
    meetLink: appointment.googleMeetLink
  });

  await sendEmail(
    appointment.patient.email,
    `Lembrete: Agendamento em ${hoursUntil} horas`,
    emailHtml
  );

  // Marcar como enviado
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { reminderSent: true }
  });
}

// Enviar notificação de cancelamento
export async function sendAppointmentCancellation(
  appointment: any,
  reason?: string
) {
  const date = moment(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
  const time = moment(appointment.startTime).tz(TIMEZONE).format("HH:mm");

  // Criar notificação no banco
  await createNotification({
    userId: appointment.patientId,
    appointmentId: appointment.id,
    type: "cancellation",
    title: "Agendamento Cancelado",
    message: `Seu agendamento com ${appointment.doctor.name} para ${date} às ${time} foi cancelado`
  });

  // Enviar email
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    doctorName: appointment.doctor.name || "Profissional",
    date,
    time,
    reason
  });

  await sendEmail(
    appointment.patient.email,
    "Agendamento Cancelado",
    emailHtml
  );
}

// Job para enviar lembretes (deve ser executado periodicamente)
export async function processAppointmentReminders() {
  const now = moment().tz(TIMEZONE);
  const twentyFourHoursFromNow = now.clone().add(24, "hours");

  // Buscar agendamentos nas próximas 24 horas que ainda não tiveram lembrete enviado
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: now.toDate(),
        lte: twentyFourHoursFromNow.toDate()
      },
      status: {
        in: ["scheduled", "confirmed"]
      },
      reminderSent: false
    },
    include: {
      patient: true,
      doctor: true
    }
  });

  // Enviar lembretes
  for (const appointment of upcomingAppointments) {
    await sendAppointmentReminder(appointment);
  }

  console.log(`${upcomingAppointments.length} lembretes enviados`);
}
