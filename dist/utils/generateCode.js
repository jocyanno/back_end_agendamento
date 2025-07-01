"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumericCode = generateNumericCode;
const crypto_1 = require("crypto");
function generateNumericCode() {
    const random = (0, crypto_1.randomBytes)(4).readUInt32BE(0);
    const code = random % 1000000;
    return code.toString().padStart(6, "0");
}
//# sourceMappingURL=generateCode.js.map