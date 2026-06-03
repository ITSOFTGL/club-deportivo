'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import attendancesApi, {
  AbsenceSearchResult,
  MonthlyAttendanceReport,
} from '@/lib/api/attendances';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useBranchesStore } from '@/store/branchesStore';
import { exportRowsToPdf } from '@/lib/exportPdf';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import toast from 'react-hot-toast';

type Tab = 'monthly' | 'absences';

export function AttendanceReportsPanel() {
  const { data: session } = useSession();
  const isTeacher = session?.user?.role === 'TEACHER';
  const { categories, fetchCategories } = useCategoriesStore();
  const { branches, fetchBranches } = useBranchesStore();

  const [tab, setTab] = useState<Tab>('monthly');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [categoryId, setCategoryId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [monthlyReport, setMonthlyReport] = useState<MonthlyAttendanceReport | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const [absenceSearch, setAbsenceSearch] = useState('');
  const [absenceFrom, setAbsenceFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
  );
  const [absenceTo, setAbsenceTo] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
  const [absenceData, setAbsenceData] = useState<AbsenceSearchResult | null>(null);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  useEffect(() => {
    if (!isTeacher) {
      fetchCategories();
      fetchBranches();
    }
  }, [isTeacher]);

  const loadMonthly = async () => {
    setLoadingMonthly(true);
    try {
      const data = await attendancesApi.getMonthlyReport({
        year,
        month,
        categoryId: categoryId || undefined,
        branchId: branchId || undefined,
      });
      setMonthlyReport(data);
    } catch {
      toast.error('No se pudo cargar el reporte mensual');
      setMonthlyReport(null);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const searchAbsences = async () => {
    if (!absenceSearch.trim()) {
      toast.error('Escriba el nombre del alumno');
      return;
    }
    setLoadingAbsences(true);
    try {
      const data = await attendancesApi.searchAbsences({
        search: absenceSearch.trim(),
        from: absenceFrom,
        to: absenceTo,
        categoryId: categoryId || undefined,
        branchId: branchId || undefined,
      });
      setAbsenceData(data);
    } catch {
      toast.error('No se encontró el alumno o sin permiso');
      setAbsenceData(null);
    } finally {
      setLoadingAbsences(false);
    }
  };

  const exportMonthlyPdf = () => {
    if (!monthlyReport?.students.length) {
      toast.error('Sin datos para exportar');
      return;
    }
    const dates = monthlyReport.listDates ?? [];
    const headers = ['Alumno', 'Categoría', ...dates, 'Total faltas'];
    const rows = monthlyReport.students.map((s) => [
      `${s.name} ${s.lastName}`,
      s.category ?? '—',
      ...dates.map((d) => s.byDay[d] ?? '—'),
      s.absences.length,
    ]);
    exportRowsToPdf(
      `Asistencia ${month}/${year}`,
      headers,
      rows,
      isTeacher
        ? 'Solo categorías asignadas al profesor'
        : 'Todas las categorías / sucursales filtradas',
    );
  };

  const exportAbsencesPdf = () => {
    if (!absenceData?.results.length) {
      toast.error('Sin datos para exportar');
      return;
    }
    const headers = ['Alumno', 'Categoría', 'Fecha', 'Estado', 'Turno'];
    const rows: (string | number)[][] = [];
    for (const r of absenceData.results) {
      for (const m of r.missed) {
        rows.push([
          `${r.name} ${r.lastName}`,
          r.category ?? '—',
          m.date,
          m.status,
          m.shiftName,
        ]);
      }
    }
    exportRowsToPdf(
      'Inasistencias',
      headers,
      rows,
      `Período ${absenceFrom} a ${absenceTo}`,
    );
  };

  return (
    <div className="space-y-4 border-t pt-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Reportes de asistencia
      </h2>
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab('monthly')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'monthly' ? 'border-[#7c0613] text-[#7c0613]' : 'border-transparent text-gray-500'
          }`}
        >
          Reporte mensual
        </button>
        <button
          type="button"
          onClick={() => setTab('absences')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'absences' ? 'border-[#7c0613] text-[#7c0613]' : 'border-transparent text-gray-500'
          }`}
        >
          Buscar inasistencias
        </button>
      </div>

      {!isTeacher && (
        <div className="grid md:grid-cols-2 gap-3">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="block w-24 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Mes</label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="block w-20 px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={loadMonthly}
              disabled={loadingMonthly}
              className="px-4 py-2 bg-[#7c0613] text-white rounded-lg text-sm"
            >
              {loadingMonthly ? 'Cargando…' : 'Generar reporte'}
            </button>
            {monthlyReport && (
              <button
                type="button"
                onClick={exportMonthlyPdf}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Exportar PDF
              </button>
            )}
          </div>

          {monthlyReport && (
            <>
              <p className="text-sm text-gray-600">
                Días con lista tomada:{' '}
                {monthlyReport.listDays.map((d) => d.date).join(', ') || 'ninguno'}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Alumno</th>
                      {(monthlyReport.listDates ?? []).map((d) => (
                        <th key={d} className="p-2 text-center whitespace-nowrap">
                          {d.slice(8)}/{d.slice(5, 7)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.students.map((s) => (
                      <tr key={s.studentId} className="border-t">
                        <td className="p-2">
                          {s.name} {s.lastName}
                        </td>
                        {(monthlyReport.listDates ?? []).map((d) => (
                          <td
                            key={d}
                            className={`p-2 text-center ${
                              s.byDay[d] === 'SI'
                                ? 'text-green-700'
                                : s.byDay[d] === 'NO' || s.byDay[d] === 'SIN_REGISTRO'
                                  ? 'text-red-700'
                                  : ''
                            }`}
                          >
                            {s.byDay[d] === 'SI' ? '✓' : s.byDay[d] === 'NO' ? '✗' : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'absences' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500">Nombre del alumno</label>
              <input
                type="search"
                value={absenceSearch}
                onChange={(e) => setAbsenceSearch(e.target.value)}
                placeholder="Buscar alumno con inasistencias…"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <input type="date" value={absenceFrom} onChange={(e) => setAbsenceFrom(e.target.value)} className="px-3 py-2 border rounded-lg" />
            <input type="date" value={absenceTo} onChange={(e) => setAbsenceTo(e.target.value)} className="px-3 py-2 border rounded-lg" />
            <button
              type="button"
              onClick={searchAbsences}
              disabled={loadingAbsences}
              className="px-4 py-2 bg-[#7c0613] text-white rounded-lg text-sm"
            >
              Buscar
            </button>
            {absenceData?.results.length ? (
              <button type="button" onClick={exportAbsencesPdf} className="px-4 py-2 border rounded-lg text-sm">
                PDF
              </button>
            ) : null}
          </div>

          {absenceData?.results.map((r) => (
            <div key={r.studentId} className="border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <StudentAvatar
                  name={r.name}
                  lastName={r.lastName}
                  profilePhotoUrl={r.profilePhotoUrl}
                  size="md"
                />
                <div>
                  <p className="font-semibold">
                    {r.name} {r.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {r.branch} · {r.category} — {r.missedCount} falta(s)
                  </p>
                </div>
              </div>
              <ul className="text-sm space-y-1">
                {r.missed.map((m) => (
                  <li key={`${m.date}-${m.status}`} className="text-red-800">
                    {m.date} — {m.status === 'SIN_REGISTRO' ? 'Sin registro / falta' : m.status}{' '}
                    {m.shiftName !== '—' ? `(${m.shiftName})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
