'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ClubLogo from '@/components/ui/ClubLogo';
import {
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { dashboardNavByRole } from '@/lib/navigation/dashboardNav';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || 'PARENT';
  const navigation = dashboardNavByRole[role] || dashboardNavByRole.PARENT;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const showLabels = isOpen;
  const desktopWidth = isOpen ? 'md:w-64' : 'md:w-[4.5rem]';

  return (
    <aside
      className={`
        z-50 flex h-full max-h-dvh flex-col flex-shrink-0 border-r border-gray-200 bg-white shadow-lg
        transition-[width,transform] duration-300 ease-out
        w-64 ${desktopWidth}
        max-md:absolute max-md:inset-y-0 max-md:left-0
        md:relative md:translate-x-0
        ${isMobile && !isOpen ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}
      `}
    >
      <div className="flex min-h-[64px] flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
        <ClubLogo size="sm" showText={showLabels} />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label={isOpen ? 'Contraer menú' : 'Expandir menú'}
        >
          {isOpen ? (
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 md:p-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              title={!showLabels ? item.name : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors md:py-3
                ${isActive
                  ? 'bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                }
                ${!showLabels ? 'md:justify-center md:px-2' : ''}`}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}
              />
              {showLabels && (
                <span className="truncate text-sm font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 space-y-2 border-t border-gray-200 p-3 md:p-4 safe-bottom">
        <div
          className={`flex items-center gap-3 ${!showLabels ? 'md:justify-center' : ''}`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#7c0613] to-[#4a030b]">
            <span className="text-sm font-medium text-white">
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session?.user?.name || session?.user?.email}
              </p>
              <p className="text-xs capitalize text-gray-500">
                {role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title={!showLabels ? 'Cerrar sesión' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 hover:bg-red-50
            ${!showLabels ? 'md:justify-center' : ''}`}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          {showLabels && <span className="text-sm font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
