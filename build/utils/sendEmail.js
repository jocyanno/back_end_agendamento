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

// src/utils/sendEmail.ts
var sendEmail_exports = {};
__export(sendEmail_exports, {
  enviarEmail: () => enviarEmail
});
module.exports = __toCommonJS(sendEmail_exports);

// src/_errors/bad-request.ts
var BadRequest = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest";
  }
};

// src/utils/nodeMailer.ts
var import_nodemailer = __toESM(require("nodemailer"));
var transporter = import_nodemailer.default.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// src/utils/sendEmail.ts
var enviarEmail = async ({
  email,
  token
}) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "C\xF3digo de Autentica\xE7\xE3o do E-mail de Recupera\xE7\xE3o de Senha",
      text: `Ecommerce informa, sua chave secreta \xE9: ${token}, validade de 3 horas.`
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enviarEmail
});
