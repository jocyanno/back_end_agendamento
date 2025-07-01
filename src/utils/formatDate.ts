import moment from "moment-timezone";

export function formatDate(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return null;

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
export function formatDateOnly(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return null;

  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  });
}

// Formatar apenas o horário (HH:mm)
export function formatTimeOnly(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return null;

  return dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });
}
