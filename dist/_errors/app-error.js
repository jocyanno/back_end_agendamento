"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// _errors/app-error.ts
class AppError extends Error {
    constructor(message, statusCode = 500, name = "AppError") {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = name;
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map