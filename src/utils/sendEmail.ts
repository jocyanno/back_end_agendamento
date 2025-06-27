import { BadRequest } from "../_errors/bad-request";
import { transporter } from "./nodeMailer";

export const enviarEmail = async ({
  email,
  token
}: {
  email: string;
  token: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Código de Autenticação do E-mail de Recuperação de Senha",
      text: `Ecommerce informa, sua chave secreta é: ${token}, validade de 3 horas.`
    });

    console.log("Email enviado com sucesso:", info.response);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new BadRequest(
      "Erro ao enviar email. Por favor, tente novamente mais tarde."
    );
  }
};
