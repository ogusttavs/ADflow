function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function toLocalDateKey(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return null;
  return localDateKey(date);
}
