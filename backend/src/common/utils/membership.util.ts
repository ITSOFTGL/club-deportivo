/** Fecha local YYYY-MM-DD */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parse YYYY-MM-DD (o ISO) como fecha local mediodía (evita desfase UTC). */
export function parseLocalDateInput(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(
      input.getFullYear(),
      input.getMonth(),
      input.getDate(),
      12,
      0,
      0,
      0,
    );
  }
  const key = input.split('T')[0];
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Pago 30 mayo + 1 mes → 30 junio (meses calendario, día local). */
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

export type MembershipStatusCode =
  | 'NONE'
  | 'EXPIRED'
  | 'LAST_DAY'
  | 'EXPIRING'
  | 'ACTIVE';

export interface MembershipStatusInfo {
  status: MembershipStatusCode;
  label: string;
  membershipActive: boolean;
  daysRemaining: number | null;
}

export function getMembershipStatus(
  paidUntil: Date | null | undefined,
  now = new Date(),
): MembershipStatusInfo {
  if (!paidUntil) {
    return {
      status: 'NONE',
      label: 'Sin pago',
      membershipActive: false,
      daysRemaining: null,
    };
  }

  const today = startOfLocalDay(now);
  const expiry = startOfLocalDay(paidUntil);
  const diffMs = expiry.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      label: 'Vencida',
      membershipActive: false,
      daysRemaining,
    };
  }

  if (daysRemaining === 0) {
    return {
      status: 'LAST_DAY',
      label: 'Último día',
      membershipActive: true,
      daysRemaining: 0,
    };
  }

  if (daysRemaining <= 5) {
    return {
      status: 'EXPIRING',
      label: `Vence en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}`,
      membershipActive: true,
      daysRemaining,
    };
  }

  return {
    status: 'ACTIVE',
    label: 'Al día',
    membershipActive: true,
    daysRemaining,
  };
}
