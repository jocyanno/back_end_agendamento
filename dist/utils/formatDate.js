"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatDateOnly = formatDateOnly;
exports.formatTimeOnly = formatTimeOnly;
function formatDate(date) {
    if (!date)
        return null;
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime()))
        return null;
    // Formato brasileiro: DD/MM/YYYY HH:mm
    return dateObj.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo"
    });
}
// Formatar apenas a data (DD/MM/YYYY)
function formatDateOnly(date) {
    if (!date)
        return null;
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime()))
        return null;
    return dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Sao_Paulo"
    });
}
// Formatar apenas o horário (HH:mm)
function formatTimeOnly(date) {
    if (!date)
        return null;
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime()))
        return null;
    return dateObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo"
    });
}
//# sourceMappingURL=formatDate.js.map