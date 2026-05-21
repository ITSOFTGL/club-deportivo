// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ClubLogo from '@/components/ui/ClubLogo';
import { 
  HomeIcon, 
  UsersIcon, 
  AcademicCapIcon,
  CreditCardIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  QrCodeIcon,
  ShieldCheckIcon  // ← Para Apoderados
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const menuItems: Record<string, any[]> = {
  SUPER_ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Sucursales', href: '/dashboard/branches', icon: BuildingOfficeIcon },
    { name: 'Usuarios', href: '/dashboard/users', icon: UsersIcon },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },  // ← NUEVO
    { name: 'Turnos', href: '/dashboard/shifts', icon: ClockIcon },
    { name: 'Categorías', href: '/dashboard/categories', icon: AcademicCapIcon },
    { name: 'Asignaciones', href: '/dashboard/assignments', icon: UserGroupIcon },
    { name: 'Alumnos', href: '/dashboard/students', icon: UsersIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
    { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Sucursales', href: '/dashboard/branches', icon: BuildingOfficeIcon },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },  // ← NUEVO
    { name: 'Alumnos', href: '/dashboard/students', icon: UsersIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
  ],
  TEACHER: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },  // ← NUEVO
    { name: 'Mis Alumnos', href: '/dashboard/my-students', icon: UsersIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Horarios', href: '/dashboard/schedule', icon: ClockIcon },
  ],
  COLLECTOR: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon },
    { name: 'Pendientes', href: '/dashboard/pending-payments', icon: QrCodeIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
  ],
  PARENT: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Mis Hijos', href: '/dashboard/my-children', icon: UsersIcon },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
  ],
};

export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || 'PARENT';
  const navigation = menuItems[role] || menuItems.PARENT;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:relative z-30 h-full bg-white dark:bg-gray-800 shadow-xl transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo - Usando ClubLogo */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <ClubLogo size="sm" showText={isOpen || !isMobile} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:block p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {navigation.map((item: any) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                  }
                  ${!isOpen && 'md:justify-center md:px-2'}`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-[#7c0613]'}`} />
                {(isOpen || !isMobile) && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className={`flex items-center space-x-3 ${!isOpen && 'md:justify-center'}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            {(isOpen || !isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 w-full
              text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
              ${!isOpen && 'justify-center'}`}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {(isOpen || !isMobile) && (
              <span className="text-sm font-medium">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}