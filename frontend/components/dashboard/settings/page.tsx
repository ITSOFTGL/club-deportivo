// app/dashboard/settings/page.tsx (para el futuro)
'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export default function SettingsPage() {
  const [logo, setLogo] = useState<File | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      await api.post('/club/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Logo actualizado correctamente');
      window.location.reload();
    } catch (error) {
      alert('Error al actualizar logo');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración del Club</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Logo del Club</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="mb-4"
        />
        <p className="text-sm text-gray-500">
          Formatos permitidos: PNG, JPG, SVG. Tamaño recomendado: 256x256px
        </p>
      </div>
    </div>
  );
}