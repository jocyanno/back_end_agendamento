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

// src/utils/generateCode.ts
var generateCode_exports = {};
__export(generateCode_exports, {
  generateNumericCode: () => generateNumericCode
});
module.exports = __toCommonJS(generateCode_exports);
var import_crypto = require("crypto");
function generateNumericCode() {
  const random = (0, import_crypto.randomBytes)(4).readUInt32BE(0);
  const code = random % 1e6;
  return code.toString().padStart(6, "0");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateNumericCode
});
