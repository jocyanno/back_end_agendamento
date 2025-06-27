import moment from "moment-timezone";

export function formatDate(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return null;

  return dateObj.toISOString().split("T")[0];
}
