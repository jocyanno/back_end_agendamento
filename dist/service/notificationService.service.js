"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.getAppointmentConfirmationTemplate = getAppointmentConfirmationTemplate;
exports.getAppointmentCancellationTemplate = getAppointmentCancellationTemplate;
exports.createNotification = createNotification;
exports.sendAppointmentConfirmation = sendAppointmentConfirmation;
exports.sendAppointmentCancellation = sendAppointmentCancellation;
const prisma_1 = require("../lib/prisma");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
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
async function sendEmail(to, subject, html) {
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
function getAppointmentConfirmationTemplate(data) {
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
        ${data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ""}
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
function getAppointmentCancellationTemplate(data) {
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
async function createNotification(data) {
    return await prisma_1.prisma.notification.create({
        data
    });
}
// Enviar notificação de confirmação
async function sendAppointmentConfirmation(appointment) {
    const date = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
    const time = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
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
async function sendAppointmentCancellation(appointment, reason) {
    const date = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE).format("DD/MM/YYYY");
    const time = (0, moment_timezone_1.default)(appointment.startTime).tz(TIMEZONE).format("HH:mm");
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
//# sourceMappingURL=notificationService.service.js.map