'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import {
  fetchTeacherAssignments,
  fetchTeacherStudents,
  buildTeacherSlots,
  type TeacherSlot,
} from '@/lib/api/teacher';
import { TeacherSlotSelector } from '@/components/teacher/TeacherSlotSelector';
import toast from 'react-hot-toast';

export default function MyStudentsPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<TeacherSlot[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [students, setStudents] = useState<
    Array<{
      id: string;
      name: string;
      lastName: string;
      category?: { name: string };
      branch?: { name: string };
      documentId?: string;
      birthDate?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeSlot = slots.find((s) => s.categoryShiftId === selectedShiftId);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const assignments = await fetchTeacherAssignments(session.user.id);
        const built = buildTeacherSlots(
          Array.isArray(assignments) ? assignments : [],
        );
        setSlots(built);
        if (built.length === 1) {
          setSelectedShiftId(built[0].categoryShiftId);
        }
      } catch {
        toast.error('Error al cargar asignaciones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!session?.user?.id || !selectedShiftId) {
        setStudents([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const data = await fetchTeacherStudents(
          session.user.id,
          selectedShiftId,
        );
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Error al cargar alumnos');
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [session?.user?.id, selectedShiftId]);

  const filtered = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      (s.documentId ?? '').includes(q)
    );
  });

  const getAge = (birthDate?: string) => {
    if (!birthDate) return '—';
    const b = new Date(birthDate);
    const diff = Date.now() - b.getTime();
    return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} años`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Alumnos</h1>
        <p className="text-gray-500 mt-1">
          Solo alumnos de la sucursal y categoría del grupo seleccionado
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          No tienes grupos asignados. Contacta al administrador.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <TeacherSlotSelector
              slots={slots}
              value={selectedShiftId}
              onChange={setSelectedShiftId}
            />
          </div>

          {activeSlot && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-white/80 text-sm">Alumnos en este grupo</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-white/80 text-sm">Categoría</p>
                <p className="text-lg font-bold">{activeSlot.categoryName}</p>
              </div>
              <div className="bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-xl p-4 text-white shadow-lg">
                <p className="text-white/80 text-sm">Sucursal</p>
                <p className="text-lg font-bold">{activeSlot.branchName}</p>
              </div>
            </div>
          )}

          {selectedShiftId && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613]"
                />
              </div>
            </div>
          )}

          {selectedShiftId && loadingStudents && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
            </div>
          )}

          {selectedShiftId && !loadingStudents && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-500">
              No hay alumnos en esta sucursal y categoría
            </div>
          )}

          {selectedShiftId && !loadingStudents && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7c0613] to-[#4a030b] flex items-center justify-center text-white font-semibold">
                      {student.name.charAt(0)}
                      {student.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.name} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getAge(student.birthDate)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <AcademicCapIcon className="w-4 h-4" />
                      {student.category?.name ?? activeSlot?.categoryName}
                    </p>
                    <p className="flex items-center gap-1">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {student.branch?.name ?? activeSlot?.branchName}
                    </p>
                    {student.documentId && (
                      <p className="text-xs text-gray-400">
                        CI: {student.documentId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedShiftId && (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              Seleccione el grupo para ver sus alumnos
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
