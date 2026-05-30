'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getMobileNavItems } from '@/lib/navigation/dashboardNav';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || 'PARENT';
  const items = getMobileNavItems(role);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 safe-bottom"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[56px] transition-colors ${
                isActive ? 'text-[#7c0613]' : 'text-gray-500'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-tight text-center truncate max-w-[72px]">
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#7c0613]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
