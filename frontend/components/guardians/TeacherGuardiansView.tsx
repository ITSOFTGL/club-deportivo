'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  buildTeacherSlots,
  fetchTeacherAssignments,
  fetchTeacherGuardians,
} from '@/lib/api/teacher';
import { TeacherSlotSelector } from '@/components/teacher/TeacherSlotSelector';

export function TeacherGuardiansView() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState(
    [] as ReturnType<typeof buildTeacherSlots>,
  );
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [guardians, setGuardians] = useState<
    Array<{
      id: string;
      name: string;
      lastName: string;
      phone: string;
      email?: string;
      relationship: string;
      student?: {
        name: string;
        lastName: string;
        category?: { name: string };
        branch?: { name: string };
      };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    const loadGuardians = async () => {
      if (!selectedShiftId) {
        setGuardians([]);
        return;
      }
      setLoadingList(true);
      try {
        const data = await fetchTeacherGuardians(selectedShiftId);
        setGuardians(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Error al cargar apoderados');
        setGuardians([]);
      } finally {
        setLoadingList(false);
      }
    };
    loadGuardians();
  }, [selectedShiftId]);

  const filtered = guardians.filter((g) => {
    const q = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      (g.email ?? '').toLowerCase().includes(q) ||
      `${g.student?.name ?? ''} ${g.student?.lastName ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apoderados</h1>
        <p className="text-gray-500 mt-1">
          Padres y tutores de tu grupo (sucursal + categoría + horario)
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          No tienes grupos asignados
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

          {selectedShiftId && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar apoderado o alumno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613]"
                  />
                </div>
              </div>

              {loadingList ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  No hay apoderados en este grupo
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((g) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                    >
                      <p className="font-semibold text-gray-900">
                        {g.name} {g.lastName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <PhoneIcon className="w-4 h-4" />
                        {g.phone}
                      </p>
                      {g.student && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600 space-y-1">
                          <p>
                            Hijo/a: {g.student.name} {g.student.lastName}
                          </p>
                          <p className="flex items-center gap-1">
                            <AcademicCapIcon className="w-4 h-4" />
                            {g.student.category?.name ?? '—'}
                          </p>
                          <p className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            {g.student.branch?.name ?? '—'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {!selectedShiftId && (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              Seleccione el grupo para ver apoderados
            </div>
          )}
        </>
      )}
    </div>
  );
}
