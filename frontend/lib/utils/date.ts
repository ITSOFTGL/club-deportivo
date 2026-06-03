/** Fecha local YYYY-MM-DD (evita desfase UTC de toISOString). */
export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Extrae YYYY-MM-DD de ISO o cadena date sin aplicar desfase UTC. */
export function dateInputFromApi(value?: string | null): string {
  if (!value?.trim()) return '';
  const key = value.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  return getLocalDateString(new Date(value));
}

/** Muestra fecha en locale sin cambiar el día por UTC. */
export function formatDateFromApi(value?: string | null): string {
  const key = dateInputFromApi(value);
  if (!key) return '—';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-BO');
}

export function formatLocalDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isoToLocalDateKey(iso?: string): string {
  return dateInputFromApi(iso);
}

export function isBirthdayToday(birthDate?: string | null): boolean {
  const key = dateInputFromApi(birthDate);
  if (!key) return false;
  const [, m, d] = key.split('-');
  const today = getLocalDateString();
  const [, tm, td] = today.split('-');
  return m === tm && d === td;
}
