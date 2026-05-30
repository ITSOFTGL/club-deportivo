export type MembershipStatusCode =
  | 'NONE'
  | 'EXPIRED'
  | 'LAST_DAY'
  | 'EXPIRING'
  | 'ACTIVE';

export interface MembershipFields {
  membershipPaidUntil?: string | null;
  membershipActive?: boolean;
  membershipStatus?: MembershipStatusCode | string;
  membershipLabel?: string;
  membershipDaysRemaining?: number | null;
}

const badgeClasses: Record<MembershipStatusCode, string> = {
  NONE: 'bg-amber-50 text-amber-800 border-amber-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  LAST_DAY: 'bg-orange-100 text-orange-900 border-orange-300',
  EXPIRING: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
};

export function formatMembershipDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO');
}

export function getMembershipBadge(student: MembershipFields) {
  const status = student.membershipStatus ?? (student.membershipActive ? 'ACTIVE' : 'NONE');
  const label = student.membershipLabel ?? (student.membershipActive ? 'Al día' : 'Sin pago');
  const until = formatMembershipDate(student.membershipPaidUntil);

  let text = label;
  if (student.membershipPaidUntil && status !== 'NONE') {
    text = `${label} · ${until}`;
  }

  return {
    status: status as MembershipStatusCode,
    text,
    className: badgeClasses[status as MembershipStatusCode] ?? badgeClasses.NONE,
  };
}
