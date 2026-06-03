'use client';

import { useEffect, useState } from 'react';
import studentsApi, { BirthdayStudent } from '@/lib/api/students';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { buildBirthdayWhatsAppUrl } from '@/lib/utils/whatsapp';

const ROLES_WITH_BIRTHDAYS = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'TEACHER',
  'COLLECTOR',
]);

export function BirthdayBanner({ role }: { role?: string }) {
  const [list, setList] = useState<BirthdayStudent[]>([]);

  useEffect(() => {
    if (!role || !ROLES_WITH_BIRTHDAYS.has(role)) return;
    studentsApi
      .getBirthdaysToday()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]));
  }, [role]);

  if (!list.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
        <span aria-hidden>🎂</span> Cumpleañeros de hoy
      </h3>
      <div className="flex flex-wrap gap-3">
        {list.map((s) => {
          const wa =
            s.parentPhone &&
            buildBirthdayWhatsAppUrl(s.parentPhone, `${s.name} ${s.lastName}`, s.age);
          return (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 border border-amber-100"
            >
              <StudentAvatar
                name={s.name}
                lastName={s.lastName}
                profilePhotoUrl={s.profilePhotoUrl}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.name} {s.lastName}
                  <span className="ml-1" aria-hidden>
                    🕯️
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {s.age} años{s.category ? ` · ${s.category}` : ''}
                </p>
              </div>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 shrink-0 text-xs font-medium text-green-700 hover:underline whitespace-nowrap"
                  title={`WhatsApp ${s.parentName ?? 'apoderado'}`}
                >
                  Felicitar
                </a>
              ) : (
                <span className="text-xs text-gray-400">Sin tel.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
