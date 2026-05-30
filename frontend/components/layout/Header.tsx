'use client';

import { useSession } from 'next-auth/react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex-shrink-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-4 py-3 flex items-center gap-3 safe-top">
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Menú"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {isMobile ? (
        <p className="flex-1 text-sm font-semibold text-gray-800 dark:text-white truncate text-center">
          {session?.user?.name?.split(' ')[0] || 'Club Deportivo'}
        </p>
      ) : (
        <p className="hidden md:block flex-1 text-sm font-medium text-gray-500">
          Sistema de gestión — Club deportivo
        </p>
      )}

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            aria-label="Notificaciones"
          >
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#7c0613] rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-3 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notificaciones</h3>
              </div>
              <div className="p-3 text-sm text-gray-500">Sin notificaciones nuevas</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="hidden sm:block max-w-[160px]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
              {session?.user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
