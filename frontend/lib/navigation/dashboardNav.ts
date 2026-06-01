import type { ComponentType } from 'react';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  CreditCardIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  QrCodeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export type NavItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  mobilePrimary?: boolean;
};

export const dashboardNavByRole: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, mobilePrimary: true },
    { name: 'Alumnos', href: '/dashboard/students', icon: UsersIcon, mobilePrimary: true },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon, mobilePrimary: true },
    { name: 'Sucursales', href: '/dashboard/branches', icon: BuildingOfficeIcon },
    { name: 'Usuarios', href: '/dashboard/users', icon: UsersIcon },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },
    { name: 'Turnos', href: '/dashboard/shifts', icon: ClockIcon },
    { name: 'Categorías', href: '/dashboard/categories', icon: AcademicCapIcon },
    { name: 'Asignaciones', href: '/dashboard/assignments', icon: UserGroupIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
    { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ],
  ADMIN: [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, mobilePrimary: true },
    { name: 'Alumnos', href: '/dashboard/students', icon: UsersIcon, mobilePrimary: true },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon, mobilePrimary: true },
    { name: 'Sucursales', href: '/dashboard/branches', icon: BuildingOfficeIcon },
    { name: 'Usuarios', href: '/dashboard/users', icon: UsersIcon },
    { name: 'Turnos', href: '/dashboard/shifts', icon: ClockIcon },
    { name: 'Categorías', href: '/dashboard/categories', icon: AcademicCapIcon },
    { name: 'Asignaciones', href: '/dashboard/assignments', icon: UserGroupIcon },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
  ],
  TEACHER: [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, mobilePrimary: true },
    { name: 'Alumnos', href: '/dashboard/my-students', icon: UsersIcon, mobilePrimary: true },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon, mobilePrimary: true },
    { name: 'Apoderados', href: '/dashboard/guardians', icon: ShieldCheckIcon },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Horarios', href: '/dashboard/schedule', icon: ClockIcon },
  ],
  COLLECTOR: [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, mobilePrimary: true },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon, mobilePrimary: true },
    { name: 'Pendientes', href: '/dashboard/pending-payments', icon: QrCodeIcon, mobilePrimary: true },
    { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
  ],
  PARENT: [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, mobilePrimary: true },
    { name: 'Hijos', href: '/dashboard/my-children', icon: UsersIcon, mobilePrimary: true },
    { name: 'Pagos', href: '/dashboard/payments', icon: CreditCardIcon, mobilePrimary: true },
    { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
    { name: 'Tienda', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Asistencias', href: '/dashboard/attendances', icon: DocumentTextIcon },
  ],
};

export function getMobileNavItems(role: string): NavItem[] {
  const items = dashboardNavByRole[role] ?? dashboardNavByRole.PARENT;
  const primary = items.filter((i) => i.mobilePrimary);
  return primary.length >= 3 ? primary.slice(0, 5) : items.slice(0, 5);
}
