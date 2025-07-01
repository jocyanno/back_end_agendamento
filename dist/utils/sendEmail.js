"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarEmail = void 0;
const bad_request_1 = require("../_errors/bad-request");
const nodeMailer_1 = require("./nodeMailer");
const enviarEmail = async ({ email, token }) => {
    try {
        const info = await nodeMailer_1.transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: "Código de Autenticação do E-mail de Recuperação de Senha",
            text: `Ecommerce informa, sua chave secreta é: ${token}, validade de 3 horas.`
        });
        console.log("Email enviado com sucesso:", info.response);
        return true;
    }
    catch (error) {
        console.error("Erro ao enviar email:", error);
        throw new bad_request_1.BadRequest("Erro ao enviar email. Por favor, tente novamente mais tarde.");
    }
};
exports.enviarEmail = enviarEmail;
//# sourceMappingURL=sendEmail.js.map