// components/attendances/AdminAttendanceView.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  UserIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAttendancesStore } from '@/store/attendancesStore';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useBranchesStore } from '@/store/branchesStore';
import { useUsersStore } from '@/store/usersStore';
import { formatLocalDateLong, isoToLocalDateKey } from '@/lib/utils/date';
import { attendanceCameLabel, formatTimeBo } from '@/lib/exportPdf';

interface Category {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export function AdminAttendanceView() {
  const { 
    attendances, 
    loading, 
    selectedDate, 
    selectedCategoryId, 
    selectedTeacherId,
    setSelectedDate, 
    setSelectedCategoryId, 
    setSelectedTeacherId,
    fetchAttendances 
  } = useAttendancesStore();
  
  const { categories, fetchCategories } = useCategoriesStore();
  const { branches, fetchBranches } = useBranchesStore();
  const { users, fetchUsers } = useUsersStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchBranches();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAttendances(selectedDate);
  }, [selectedDate]);

  const teachers: Teacher[] = users
    .filter(u => u.role === 'TEACHER')
    .map(u => ({
      id: u.id,
      name: u.name,
      lastName: u.lastName || '',
      email: u.email,
    }));

  const filteredAttendances = attendances.filter((attendance) => {
    if (selectedCategoryId && attendance.student?.categoryId !== selectedCategoryId) return false;
    if (selectedBranchId && attendance.student?.branchId !== selectedBranchId) return false;
    if (selectedTeacherId && attendance.verifiedBy !== selectedTeacherId) return false;
    // Filtrar por búsqueda de alumno
    if (searchTerm) {
      const studentName = `${attendance.student?.name || ''} ${attendance.student?.lastName || ''}`.toLowerCase();
      if (!studentName.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  // Agrupar por fecha
  const groupedByDate = filteredAttendances.reduce(
    (acc, attendance) => {
      const date = isoToLocalDateKey(attendance.createdAt);
      if (!acc[date]) acc[date] = [];
      acc[date].push(attendance);
      return acc;
    },
    {} as Record<string, typeof attendances>,
  );

  const cameCount = filteredAttendances.filter(
    (a) => attendanceCameLabel(a.status) === 'Sí',
  ).length;
  const notCameCount = filteredAttendances.filter(
    (a) => attendanceCameLabel(a.status) === 'No',
  ).length;

  const stats = [
    { label: 'Registros', value: filteredAttendances.length, icon: CalendarIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Vinieron', value: cameCount, icon: CalendarIcon, color: 'from-green-500 to-green-600' },
    { label: 'No vinieron', value: notCameCount, icon: CalendarIcon, color: 'from-red-500 to-red-600' },
  ];

  const formatRecordDateTime = (createdAt?: string, checkIn?: string) => {
    if (!createdAt) return '—';
    const d = new Date(createdAt);
    const date = d.toLocaleDateString('es-BO');
    const time = checkIn
      ? formatTimeBo(checkIn)
      : d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  const exportToCSV = () => {
    const headers = ['Alumno', 'Sucursal', 'Fecha y hora', '¿Vino?', 'Observación / licencia', 'Profesor'];
    const rows = filteredAttendances.map(a => [
      `${a.student?.name || ''} ${a.student?.lastName || ''}`,
      a.student?.branch?.name || '-',
      formatRecordDateTime(a.createdAt, a.checkInTime),
      attendanceCameLabel(a.status),
      a.observations || '-',
      a.verifier
        ? `${a.verifier.name} ${a.verifier.lastName ?? ''}`.trim()
        : '-',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencias_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporte de Asistencias</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Visualiza y filtra todas las asistencias del club</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredAttendances.length === 0}
          className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-10 h-10 text-white/30" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
            />
          </div>
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <AcademicCapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
            >
              <option value="">Todos los profesores</option>
              {teachers.map((t: Teacher) => (
                <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
            />
          </div>
        </div>
      </div>

      {/* Tabla agrupada por fecha */}
      <div className="space-y-6">
        {Object.entries(groupedByDate)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, dateAttendances]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {formatLocalDateLong(date)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {dateAttendances.length} registros
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">¿Vino?</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observación / licencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dateAttendances.map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {attendance.student?.name} {attendance.student?.lastName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {attendance.student?.branch?.name || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatRecordDateTime(attendance.createdAt, attendance.checkInTime)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attendanceCameLabel(attendance.status) === 'Sí'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {attendanceCameLabel(attendance.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs">{attendance.observations || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">
                            {attendance.verifier
                              ? `${attendance.verifier.name} ${attendance.verifier.lastName ?? ''}`.trim()
                              : '—'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {filteredAttendances.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500">No hay asistencias registradas con los filtros seleccionados</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
          </div>
        )}
      </div>
    </div>
  );
}