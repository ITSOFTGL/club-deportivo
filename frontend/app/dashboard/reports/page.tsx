'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { useReportsStore } from '@/store/reportsStore';
import reportsApi from '@/lib/api/reports';
import { exportRowsToPdf, formatDateBo } from '@/lib/exportPdf';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { dashboard, loading, fetchDashboard } = useReportsStore();
  const [parentSearch, setParentSearch] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const runExport = async (
    key: string,
    title: string,
    headers: string[],
    loader: () => Promise<Record<string, unknown>[]>,
    mapRow: (row: Record<string, unknown>) => (string | number | null | undefined)[],
  ) => {
    setExporting(key);
    try {
      const data = await loader();
      exportRowsToPdf(
        title,
        headers,
        data.map(mapRow),
      );
    } catch {
      toast.error('No se pudo generar el reporte');
    } finally {
      setExporting(null);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(n);

  const summary = dashboard?.summary;

  const cards = summary
    ? [
        {
          label: 'Alumnos activos',
          value: summary.activeStudents,
          total: summary.totalStudents,
          icon: UsersIcon,
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: 'Ingresos del mes',
          value: formatMoney(summary.monthlyRevenue),
          sub: `${summary.monthlyPaidCount} pagos`,
          icon: CreditCardIcon,
          color: 'from-green-500 to-green-600',
        },
        {
          label: 'Pagos pendientes',
          value: summary.pendingPayments,
          icon: CreditCardIcon,
          color: 'from-amber-500 to-amber-600',
        },
        {
          label: 'Categorías activas',
          value: summary.totalCategories,
          icon: AcademicCapIcon,
          color: 'from-purple-500 to-purple-600',
        },
        {
          label: 'Turnos base',
          value: summary.totalShifts,
          icon: ClockIcon,
          color: 'from-indigo-500 to-indigo-600',
        },
        {
          label: 'Asistencias (mes)',
          value: summary.monthlyAttendances,
          icon: DocumentTextIcon,
          color: 'from-[#7c0613] to-[#4a030b]',
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-8 h-8 text-[#7c0613]" />
          Reportes
        </h1>
        <p className="text-gray-500 mt-1">
          Resumen y exportación PDF (imprimir → Guardar como PDF)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c0613]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`bg-gradient-to-r ${card.color} rounded-xl p-5 text-white shadow-lg`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    {'sub' in card && card.sub && (
                      <p className="text-white/70 text-xs mt-1">{card.sub}</p>
                    )}
                    {'total' in card && card.total !== undefined && (
                      <p className="text-white/70 text-xs mt-1">
                        de {card.total} registrados
                      </p>
                    )}
                  </div>
                  <card.icon className="w-10 h-10 text-white/30" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5 text-[#7c0613]" />
              Exportar reportes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() =>
                  runExport(
                    'payments',
                    'Pagos registrados',
                    ['Alumno', 'Categoría', 'Monto', 'Método', 'Estado', 'Fecha', 'Vence'],
                    reportsApi.exportPayments,
                    (r) => [
                      String(r.alumno),
                      String(r.categoria),
                      Number(r.monto),
                      String(r.metodo),
                      String(r.estado),
                      formatDateBo(r.fechaPago as string),
                      formatDateBo(r.vence as string),
                    ],
                  )
                }
                className="p-4 border rounded-lg hover:border-[#7c0613] text-left text-sm"
              >
                {exporting === 'payments' ? 'Generando...' : 'Pagos (PDF)'}
              </button>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() =>
                  runExport(
                    'teachers',
                    'Profesores y asignaciones',
                    ['Nombre', 'Email', 'Teléfono', 'Asignaciones'],
                    reportsApi.exportTeachers,
                    (r) => [
                      String(r.nombre),
                      String(r.email),
                      String(r.telefono),
                      String(r.asignaciones),
                    ],
                  )
                }
                className="p-4 border rounded-lg hover:border-[#7c0613] text-left text-sm"
              >
                {exporting === 'teachers' ? 'Generando...' : 'Profesores (PDF)'}
              </button>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() =>
                  runExport(
                    'students',
                    'Alumnos por categoría',
                    [
                      'Categoría',
                      'Alumno',
                      'Padre',
                      'Teléfono',
                      'Mensualidad hasta',
                      'Al día',
                    ],
                    reportsApi.exportCategoriesStudents,
                    (r) => [
                      String(r.categoria),
                      String(r.alumno),
                      String(r.padre),
                      String(r.telefonoPadre),
                      formatDateBo(r.mensualidadHasta as string),
                      r.alDia ? 'Sí' : 'No',
                    ],
                  )
                }
                className="p-4 border rounded-lg hover:border-[#7c0613] text-left text-sm"
              >
                {exporting === 'students' ? 'Generando...' : 'Categorías + alumnos'}
              </button>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() =>
                  runExport(
                    'parents',
                    'Padres de familia',
                    ['Nombre', 'Email', 'Teléfono', 'Hijos'],
                    () => reportsApi.exportParents(parentSearch || undefined),
                    (r) => [
                      String(r.nombre),
                      String(r.email),
                      String(r.telefono),
                      String(r.hijos),
                    ],
                  )
                }
                className="p-4 border rounded-lg hover:border-[#7c0613] text-left text-sm"
              >
                {exporting === 'parents' ? 'Generando...' : 'Padres / teléfonos'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
              <div className="relative flex-1">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  placeholder="Buscar padre por nombre, teléfono o email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const rows = await reportsApi.exportParents(
                      parentSearch || undefined,
                    );
                    const match = rows.find((r) =>
                      String(r.telefono ?? '').includes(
                        parentSearch.replace(/\D/g, ''),
                      ),
                    ) || rows[0];
                    const wa = match?.whatsapp ? String(match.whatsapp) : '';
                    if (wa) {
                      window.open(wa, '_blank');
                    } else {
                      toast.error('No hay teléfono registrado');
                    }
                  } catch {
                    toast.error('Error al buscar');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium whitespace-nowrap"
              >
                Abrir WhatsApp
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Alumnos por categoría
              </h2>
              {dashboard?.studentsByCategory?.length ? (
                <ul className="space-y-3">
                  {dashboard.studentsByCategory.map((row) => (
                    <li
                      key={row.categoryId}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <span className="text-gray-700">{row.categoryName}</span>
                      <span className="font-semibold text-[#7c0613]">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Sin datos</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Pagos por estado
              </h2>
              {dashboard?.paymentsByStatus?.length ? (
                <ul className="space-y-3">
                  {dashboard.paymentsByStatus.map((row) => (
                    <li
                      key={row.status}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <span className="text-gray-700">{row.status}</span>
                      <span className="font-semibold">{row.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Sin datos</p>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
