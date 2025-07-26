"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/error-handler.ts
var error_handler_exports = {};
__export(error_handler_exports, {
  errorHandler: () => errorHandler
});
module.exports = __toCommonJS(error_handler_exports);
var import_v4 = require("zod/v4");

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

// src/error-handler.ts
function errorHandler(error, request, reply) {
  if (error instanceof import_v4.ZodError) {
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      issues: error.flatten().fieldErrors
    });
  }
  if (error.code === "FST_ERR_CTP_EMPTY_JSON_BODY") {
    return reply.status(400).send({
      status: "error",
      message: "Requisi\xE7\xE3o inv\xE1lida: n\xE3o envie body em requisi\xE7\xF5es GET ou DELETE"
    });
  }
  if (error.code === "FST_ERR_VALIDATION") {
    if (error.validationContext === "headers" && String(error.message).toLowerCase().includes("authorization")) {
      return reply.status(401).send({
        status: "error",
        message: "Token inv\xE1lido ou n\xE3o fornecido"
      });
    }
    return reply.status(400).send({
      status: "error",
      message: "Validation error",
      details: error.message
    });
  }
  if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
    return reply.status(401).send({
      status: "error",
      message: "Token inv\xE1lido ou n\xE3o fornecido"
    });
  }
  if (error.code === "FST_JWT_BAD_REQUEST") {
    return reply.status(401).send({
      status: "error",
      message: "Token inv\xE1lido"
    });
  }
  if (error instanceof BadRequest) {
    return reply.status(400).send({
      status: "error",
      message: error.message
    });
  }
  if (error instanceof NotFound) {
    return reply.status(404).send({
      status: "error",
      message: error.message
    });
  }
  if (error instanceof Unauthorized) {
    return reply.status(401).send({
      status: "error",
      message: error.message
    });
  }
  console.error("Internal server error:", error);
  return reply.status(500).send({
    status: "error",
    message: "Internal server error"
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  errorHandler
});
