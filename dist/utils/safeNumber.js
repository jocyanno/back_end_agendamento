"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeNumber = safeNumber;
function safeNumber(value) {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
}
//# sourceMappingURL=safeNumber.js.map