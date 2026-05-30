const DAY_ALIASES: Record<string, number> = {
  DOM: 0,
  DOMINGO: 0,
  LUN: 1,
  LUNES: 1,
  MAR: 2,
  MARTES: 2,
  MIE: 3,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  JUE: 4,
  JUEVES: 4,
  VIE: 5,
  VIERNES: 5,
  SAB: 6,
  SABADO: 6,
  SÁBADO: 6,
};

export function parseDaysOfWeek(raw: string): number[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .toUpperCase()
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => DAY_ALIASES[p])
        .filter((d): d is number => d !== undefined),
    ),
  ];
}

export function formatDaysOfWeek(raw: string): string {
  const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const days = parseDaysOfWeek(raw);
  if (days.length === 0) return raw || '—';
  return days.map((d) => labels[d]).join(', ');
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a1 = toMinutes(startA);
  const a2 = toMinutes(endA);
  const b1 = toMinutes(startB);
  const b2 = toMinutes(endB);
  return a1 < b2 && b1 < a2;
}

export function schedulesConflict(
  a: { daysOfWeek: string; startTime: string; endTime: string },
  b: { daysOfWeek: string; startTime: string; endTime: string },
): boolean {
  const daysA = parseDaysOfWeek(a.daysOfWeek);
  const daysB = parseDaysOfWeek(b.daysOfWeek);
  const sharedDay = daysA.some((d) => daysB.includes(d));
  if (!sharedDay) return false;
  return timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
}
