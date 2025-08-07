import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

const TIMEZONE = "America/Sao_Paulo";

// Configurar transporter do nodemailer - temporariamente desabilitado
/* 
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});
*/

// Enviar email - temporariamente desabilitado
export async function sendEmail(to: string, subject: string, html: string) {
  // Função temporariamente desabilitada para evitar erros de configuração SMTP
  console.log("Envio de email desabilitado temporariamente");
  console.log(`Para: ${to}, Assunto: ${subject}`);
  return true;

  /* 
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
  */
}

// Template de email para confirmação de agendamento
export function getAppointmentConfirmationTemplate(data: {
  patientName: string;
  professionalName: string;
  date: string;
  time: string;
  location?: string;
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
      </div>
      
      <p><strong>Importante:</strong> Caso precise cancelar, faça isso com pelo menos 24 horas de antecedência.</p>
      <p><strong>Lembrete:</strong> O evento foi adicionado ao seu calendário Google.</p>
      
      <p>Atenciosamente,<br>
      Sistema de Agendamento</p>
    </div>
  `;
}

// Template de lembrete removido - Google Calendar cuida dos lembretes automaticamente

// Template de email para cancelamento
export function getAppointmentCancellationTemplate(data: {
  patientName: string;
  professionalName: string;
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
    message: `Seu agendamento com ${appointment.professional.name} foi confirmado para ${date} às ${time}`
  });

  // Enviar email
  const emailHtml = getAppointmentConfirmationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
    date,
    time
  });

  // Envio de email temporariamente desabilitado
  // await sendEmail(
  //   appointment.patient.email,
  //   "Confirmação de Agendamento",
  //   emailHtml
  // );
}

// Função de lembrete removida - Google Calendar cuida dos lembretes automaticamente

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
    message: `Seu agendamento com ${appointment.professional.name} para ${date} às ${time} foi cancelado`
  });

  // Enviar email
  const emailHtml = getAppointmentCancellationTemplate({
    patientName: appointment.patient.name || "Paciente",
    professionalName: appointment.professional.name || "Profissional",
    date,
    time,
    reason
  });

  // Envio de email temporariamente desabilitado
  // await sendEmail(
  //   appointment.patient.email,
  //   "Agendamento Cancelado",
  //   emailHtml
  // );
}

// Job de lembretes removido - Google Calendar cuida dos lembretes automaticamente
// O sistema agora utiliza apenas:
// - Confirmação de agendamento (sendAppointmentConfirmation)
// - Notificação de cancelamento (sendAppointmentCancellation)
// - Lembretes ficam por conta do Google Calendar
