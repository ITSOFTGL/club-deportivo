'use client';

import type { TeacherSlot } from '@/lib/api/teacher';

interface TeacherSlotSelectorProps {
  slots: TeacherSlot[];
  value: string;
  onChange: (categoryShiftId: string) => void;
  label?: string;
}

export function TeacherSlotSelector({
  slots,
  value,
  onChange,
  label = 'Grupo asignado (sucursal + categoría + horario)',
}: TeacherSlotSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#7c0613] bg-white text-sm"
        required
      >
        <option value="">Seleccione sucursal y horario de su asignación</option>
        {slots.map((slot) => (
          <option key={slot.categoryShiftId} value={slot.categoryShiftId}>
            {slot.label}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-gray-500 mt-1.5">
          Solo verá alumnos y apoderados de esta sucursal y categoría.
        </p>
      )}
    </div>
  );
}
