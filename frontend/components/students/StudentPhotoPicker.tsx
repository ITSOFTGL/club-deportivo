'use client';

import { useEffect, useState } from 'react';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { resolveMediaUrl } from '@/lib/utils/mediaUrl';

type Props = {
  name: string;
  lastName: string;
  existingPhotoUrl?: string | null;
  onFileChange: (file: File | null) => void;
};

export function StudentPhotoPicker({
  name,
  lastName,
  existingPhotoUrl,
  onFileChange,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
  }, [existingPhotoUrl, name, lastName]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileChange(file);
    } else {
      setPreview(null);
      onFileChange(null);
    }
  };

  const displayUrl = preview || existingPhotoUrl;
  const resolvedPreview = preview ? resolveMediaUrl(preview) : undefined;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-900/30">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Foto de perfil
      </label>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative flex-shrink-0">
          {resolvedPreview ? (
            <img
              src={resolvedPreview}
              alt="Vista previa"
              className="w-20 h-20 rounded-xl object-cover ring-2 ring-[#7c0613]/30 shadow-md"
            />
          ) : (
            <StudentAvatar
              name={name}
              lastName={lastName}
              profilePhotoUrl={displayUrl}
              size="xl"
            />
          )}
          {preview && (
            <span className="absolute -bottom-1 -right-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              Nueva
            </span>
          )}
        </div>
        <div className="flex-1 w-full space-y-2">
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#7c0613] file:text-white file:text-sm file:cursor-pointer"
          />
          {preview && (
            <p className="text-xs text-green-700 font-medium">
              Vista previa lista. Pulse Guardar para subir la foto.
            </p>
          )}
          {!preview && existingPhotoUrl && (
            <p className="text-xs text-gray-500">
              Foto actual cargada. Elija otra imagen para reemplazarla.
            </p>
          )}
          {!preview && !existingPhotoUrl && (
            <p className="text-xs text-gray-500">JPG, PNG, WEBP o HEIC — máx. 25 MB</p>
          )}
        </div>
      </div>
    </div>
  );
}
