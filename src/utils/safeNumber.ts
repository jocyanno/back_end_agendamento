export function safeNumber(value?: string): number | undefined {
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}
