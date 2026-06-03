// components/students/StudentFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { dateInputFromApi, getLocalDateString } from '@/lib/utils/date';
import { StudentPhotoPicker } from '@/components/students/StudentPhotoPicker';
import { getApiErrorMessage } from '@/lib/apiError';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatCategoryLabel } from '@/lib/api/categories';
import { getStudentMonthlyFee } from '@/lib/utils/studentFee';
import studentsApi from '@/lib/api/students';
import { StudentAvatar } from '@/components/ui/StudentAvatar';

interface Branch {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  groupLabel?: string;
  monthlyPrice?: number;
  branch?: { name?: string };
  isActive?: boolean;
}

interface Parent {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  lastName: string;
  birthDate: string;
  documentId?: string;
  gender?: string;
  weight?: number;
  height?: number;
  shoeSize?: number;
  shirtSize?: string;
  pantsSize?: string;
  medicalNotes?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  school?: string;
  grade?: string;
  parentId?: string;
  branchId: string;
  categoryId: string;
  enrollmentDate?: string;
  discountPercent?: number;
  monthlyFeeOverride?: number;
  profilePhotoUrl?: string;
  status?: string;
}

interface CreateStudentDto {
  name: string;
  lastName: string;
  birthDate: string;
  documentId?: string;
  gender?: string;
  weight?: number;
  height?: number;
  shoeSize?: number;
  shirtSize?: string;
  pantsSize?: string;
  medicalNotes?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  school?: string;
  grade?: string;
  parentId?: string;
  branchId: string;
  categoryId: string;
  enrollmentDate?: string;
  monthlyFeeOverride?: number;
}

const genders = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

const bloodTypes = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
];

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  branches: Branch[];
  categories: Category[];
  parents: Parent[];
  onSubmit: (data: CreateStudentDto) => Promise<{ success: boolean; studentId?: string }>;
  loading?: boolean;
}

export function StudentFormModal({
  isOpen,
  onClose,
  student,
  branches,
  categories,
  parents,
  onSubmit,
  loading = false,
}: StudentFormModalProps) {
  const isQuickRegister = !student;
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    lastName: '',
    birthDate: '',
    documentId: '',
    gender: '',
    weight: '',
    height: '',
    shoeSize: '',
    shirtSize: '',
    pantsSize: '',
    medicalNotes: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: '',
    school: '',
    grade: '',
    parentId: '',
    branchId: '',
    categoryId: '',
    enrollmentDate: getLocalDateString(),
    discountPercent: 0,
    monthlyFeeOverride: '',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        lastName: student.lastName || '',
        birthDate: dateInputFromApi(student.birthDate),
        documentId: student.documentId || '',
        gender: student.gender || '',
        weight: student.weight?.toString() || '',
        height: student.height?.toString() || '',
        shoeSize: student.shoeSize?.toString() || '',
        shirtSize: student.shirtSize || '',
        pantsSize: student.pantsSize || '',
        medicalNotes: student.medicalNotes || '',
        bloodType: student.bloodType || '',
        emergencyContact: student.emergencyContact || '',
        emergencyPhone: student.emergencyPhone || '',
        school: student.school || '',
        grade: student.grade || '',
        parentId: student.parentId || '',
        branchId: student.branchId || '',
        categoryId: student.categoryId || '',
        enrollmentDate: student.enrollmentDate
          ? dateInputFromApi(student.enrollmentDate)
          : getLocalDateString(),
        discountPercent: student.discountPercent ?? 0,
        monthlyFeeOverride: student.monthlyFeeOverride?.toString() ?? '',
      });
      setPhotoFile(null);
    } else {
      setFormData({
        name: '',
        lastName: '',
        birthDate: '',
        documentId: '',
        gender: '',
        weight: '',
        height: '',
        shoeSize: '',
        shirtSize: '',
        pantsSize: '',
        medicalNotes: '',
        bloodType: '',
        emergencyContact: '',
        emergencyPhone: '',
        school: '',
        grade: '',
        parentId: '',
        branchId: '',
        categoryId: '',
        enrollmentDate: getLocalDateString(),
        discountPercent: 0,
        monthlyFeeOverride: '',
      });
      setPhotoFile(null);
    }
  }, [student, isOpen]);

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const categoryPrice = selectedCategory?.monthlyPrice ?? 0;
  const feePreview = getStudentMonthlyFee({
    category: { monthlyPrice: categoryPrice },
    discountPercent: Number(formData.discountPercent) || 0,
    monthlyFeeOverride:
      formData.monthlyFeeOverride !== '' && formData.monthlyFeeOverride != null
        ? Number(formData.monthlyFeeOverride)
        : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construir el DTO con todos los campos
    const dataToSend: CreateStudentDto = {
      name: formData.name,
      lastName: formData.lastName,
      birthDate: formData.birthDate,
      branchId: formData.branchId,
      categoryId: formData.categoryId,
    };

    if (formData.enrollmentDate?.trim()) {
      dataToSend.enrollmentDate = formData.enrollmentDate;
    }

    if (formData.parentId?.trim()) {
      dataToSend.parentId = formData.parentId;
    }
    
    // Agregar campos opcionales si tienen valor
    if (formData.documentId && formData.documentId.trim()) dataToSend.documentId = formData.documentId;
    if (formData.gender && formData.gender.trim()) dataToSend.gender = formData.gender;
    if (formData.weight && formData.weight.trim()) dataToSend.weight = parseFloat(formData.weight);
    if (formData.height && formData.height.trim()) dataToSend.height = parseFloat(formData.height);
    if (formData.shoeSize && formData.shoeSize.trim()) dataToSend.shoeSize = parseInt(formData.shoeSize);
    if (formData.shirtSize && formData.shirtSize.trim()) dataToSend.shirtSize = formData.shirtSize;
    if (formData.pantsSize && formData.pantsSize.trim()) dataToSend.pantsSize = formData.pantsSize;
    if (formData.medicalNotes && formData.medicalNotes.trim()) dataToSend.medicalNotes = formData.medicalNotes;
    if (formData.bloodType && formData.bloodType.trim()) dataToSend.bloodType = formData.bloodType;
    if (formData.emergencyContact && formData.emergencyContact.trim()) dataToSend.emergencyContact = formData.emergencyContact;
    if (formData.emergencyPhone && formData.emergencyPhone.trim()) dataToSend.emergencyPhone = formData.emergencyPhone;
    if (formData.school && formData.school.trim()) dataToSend.school = formData.school;
    if (formData.grade && formData.grade.trim()) dataToSend.grade = formData.grade;
    if (formData.discountPercent !== '' && formData.discountPercent != null) {
      dataToSend.discountPercent = Number(formData.discountPercent);
    }
    if (formData.monthlyFeeOverride !== '' && formData.monthlyFeeOverride != null) {
      dataToSend.monthlyFeeOverride = Number(formData.monthlyFeeOverride);
    }

    const result = await onSubmit(dataToSend);
    const targetId = result.studentId ?? student?.id;
    if (result.success && photoFile && targetId) {
      try {
        await studentsApi.uploadPhoto(targetId, photoFile);
        toast.success('Foto de perfil guardada');
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, 'Alumno guardado, pero no se pudo subir la foto'),
        );
      }
    }
    if (result.success) {
      onClose();
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {student ? 'Editar Alumno' : 'Registro rápido de alumno'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {isQuickRegister && (
                  <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    Solo datos esenciales. El apoderado y la cuenta de acceso se registran después en{' '}
                    <strong>Apoderados</strong>. Luego registre el pago desde la lista de alumnos.
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  {/* Sucursal y categoría primero en registro rápido */}
                  {isQuickRegister && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sucursal *
                        </label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => updateField('branchId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        >
                          <option value="">Seleccionar sucursal</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Categoría *
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => updateField('categoryId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories
                            .filter(
                              (c) =>
                                c.isActive !== false || c.id === formData.categoryId,
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {formatCategoryLabel(c)}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de ingreso / inscripción *
                        </label>
                        <input
                          type="date"
                          value={formData.enrollmentDate}
                          onChange={(e) => updateField('enrollmentDate', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          La mensualidad se calcula desde esta fecha, no desde el día del pago.
                        </p>
                      </div>
                      {formData.categoryId && categoryPrice > 0 && (
                        <div className="md:col-span-2 rounded-lg border border-green-100 bg-green-50 p-3 space-y-3">
                          <p className="text-sm font-medium text-green-900">Mensualidad de este alumno</p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Descuento (%)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={formData.discountPercent}
                                onChange={(e) => updateField('discountPercent', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                O monto fijo mensual (Bs)
                              </label>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={formData.monthlyFeeOverride}
                                onChange={(e) => updateField('monthlyFeeOverride', e.target.value)}
                                placeholder={`Ej: 200 (categoría Bs ${categoryPrice})`}
                                className="w-full px-3 py-2 rounded-lg border"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-green-800">
                            Tarifa categoría: <strong>Bs {categoryPrice}</strong> → Pagará:{' '}
                            <strong>Bs {feePreview}</strong> / mes
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Información Personal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                        required
                        placeholder="Nombre del alumno"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                        placeholder="Apellido del alumno"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => updateField('birthDate', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Género
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Seleccionar</option>
                        {genders.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isQuickRegister && !showMoreFields && (
                    <button
                      type="button"
                      onClick={() => setShowMoreFields(true)}
                      className="text-sm text-[#7c0613] font-medium hover:underline"
                    >
                      + Agregar más datos (documento, escuela, médico…)
                    </button>
                  )}

                  {(!isQuickRegister || showMoreFields) && (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Documento de Identidad
                      </label>
                      <input
                        type="text"
                        value={formData.documentId}
                        onChange={(e) => updateField('documentId', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="CI, Pasaporte, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Grupo Sanguíneo
                      </label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => updateField('bloodType', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Seleccionar</option>
                        {bloodTypes.map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Datos Físicos */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Datos Físicos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) => updateField('weight', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="Ej: 25.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Altura (cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.height}
                          onChange={(e) => updateField('height', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="Ej: 120.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Talla Zapato
                        </label>
                        <input
                          type="number"
                          value={formData.shoeSize}
                          onChange={(e) => updateField('shoeSize', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="Ej: 28"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Talla Camiseta
                        </label>
                        <input
                          type="text"
                          value={formData.shirtSize}
                          onChange={(e) => updateField('shirtSize', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="S, M, L, XL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Talla Pantalón
                        </label>
                        <input
                          type="text"
                          value={formData.pantsSize}
                          onChange={(e) => updateField('pantsSize', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="S, M, L, XL"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Escuela */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Colegio/Institución
                      </label>
                      <input
                        type="text"
                        value={formData.school}
                        onChange={(e) => updateField('school', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="Nombre del colegio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Grado
                      </label>
                      <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) => updateField('grade', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="Ej: 5to Primaria"
                      />
                    </div>
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Contacto de Emergencia</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre Contacto
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContact}
                          onChange={(e) => updateField('emergencyContact', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="Nombre del contacto de emergencia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Teléfono Emergencia
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => updateField('emergencyPhone', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="Teléfono de emergencia"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notas Médicas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas Médicas
                    </label>
                    <textarea
                      value={formData.medicalNotes}
                      onChange={(e) => updateField('medicalNotes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      placeholder="Alergias, condiciones médicas, medicamentos, observaciones importantes..."
                    />
                  </div>

                  {/* Asignación (solo edición o datos extra) */}
                  {!isQuickRegister && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Asignación</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sucursal *
                        </label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => updateField('branchId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        >
                          <option value="">Seleccionar sucursal</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Categoría *
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => updateField('categoryId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories
                            .filter(
                              (c) =>
                                c.isActive !== false || c.id === formData.categoryId,
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {formatCategoryLabel(c)}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cuenta padre/madre (opcional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Mejor asignar desde <strong>Apoderados</strong> con opción de crear cuenta.
                        </p>
                        <select
                          value={formData.parentId}
                          onChange={(e) => updateField('parentId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        >
                          <option value="">Sin cuenta vinculada</option>
                          {parents.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.lastName} - {p.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de ingreso / inscripción *
                        </label>
                        <input
                          type="date"
                          value={formData.enrollmentDate}
                          onChange={(e) => updateField('enrollmentDate', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descuento mensualidad (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={formData.discountPercent}
                          onChange={(e) =>
                            updateField('discountPercent', e.target.value)
                          }
                          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  )}
                  </>
                  )}

                  <StudentPhotoPicker
                    name={formData.name}
                    lastName={formData.lastName}
                    existingPhotoUrl={student?.profilePhotoUrl}
                    onFileChange={setPhotoFile}
                  />

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : student ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}