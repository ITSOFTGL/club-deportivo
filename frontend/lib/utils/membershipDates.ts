/** Utilidades de fechas para mensualidad (frontend, zona local). */

export function parseLocalDateInput(input: string): Date {
  const key = input.split('T')[0];
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addCalendarMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const result = new Date(y, m + months, d, 12, 0, 0, 0);
  if (result.getDate() !== d) {
    return new Date(y, m + months + 1, 0, 12, 0, 0, 0);
  }
  return result;
}

export function formatLocalDate(dateKey: string): string {
  return parseLocalDateInput(dateKey).toLocaleDateString('es-BO');
}

export function resolvePaymentQrUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${api}${url}`;
  }
  return url;
}
