'use client';

import { useEffect, useState } from 'react';
import { StudentAvatar } from '@/components/ui/StudentAvatar';

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
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    } else {
      setPreview(null);
      onFileChange(null);
    }
  };

  const displayUrl = preview || existingPhotoUrl;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-900/30">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Foto de perfil
      </label>
      <div className="flex items-center gap-4">
        <StudentAvatar
          name={name}
          lastName={lastName}
          profilePhotoUrl={displayUrl}
          size="lg"
        />
        <div className="flex-1 space-y-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#7c0613] file:text-white file:text-sm"
          />
          {preview && (
            <p className="text-xs text-green-700">Vista previa lista. Guarde para subir la foto.</p>
          )}
          {!preview && existingPhotoUrl && (
            <p className="text-xs text-gray-500">Foto actual. Elija otra imagen para reemplazarla.</p>
          )}
        </div>
      </div>
    </div>
  );
}
