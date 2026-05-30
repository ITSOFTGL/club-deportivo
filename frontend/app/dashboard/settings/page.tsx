'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import paymentsApi from '@/lib/api/payments';
import { resolvePaymentQrUrl } from '@/lib/utils/membershipDates';
import { useClubConfig } from '@/hooks/useClubConfig';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const { paymentQrUrl: defaultQr } = useClubConfig();
  const [qrUrl, setQrUrl] = useState(defaultQr);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (role && role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  useEffect(() => {
    paymentsApi.getConfig().then((c) => {
      if (c?.paymentQrUrl) setQrUrl(c.paymentQrUrl);
    }).catch(() => {});
  }, []);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await paymentsApi.uploadQr(file);
      setQrUrl(result.paymentQrUrl);
      toast.success('QR de pago actualizado');
    } catch {
      toast.error('No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  if (role !== 'SUPER_ADMIN') {
    return null;
  }

  const preview = resolvePaymentQrUrl(qrUrl || defaultQr);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Ajustes del club (solo super administrador)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-4">
        <h2 className="text-lg font-semibold">QR de pago</h2>
        <p className="text-sm text-gray-600">
          Esta imagen la verán cobradores y padres al registrar un pago por QR o transferencia.
        </p>

        {preview && (
          <img
            src={preview}
            alt="Vista previa QR"
            className="mx-auto max-h-48 object-contain border rounded-lg p-2"
          />
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Subir imagen (PNG o JPG)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleQrUpload}
            disabled={uploading}
            className="text-sm"
          />
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-gray-700">Alternativa manual (sin subir aquí):</p>
          <p>
            Coloque el archivo en{' '}
            <code className="bg-white px-1 rounded">frontend/public/images/payment-qr.png</code>
          </p>
          <p>Nombre recomendado: <strong>payment-qr.png</strong> (también sirve .jpg)</p>
        </div>
      </div>
    </div>
  );
}
