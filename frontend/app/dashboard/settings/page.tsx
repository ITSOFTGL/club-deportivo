'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import paymentsApi from '@/lib/api/payments';
import { resolvePaymentQrUrl } from '@/lib/utils/membershipDates';
import { useClubConfig } from '@/hooks/useClubConfig';
import { getApiErrorMessage } from '@/lib/apiError';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const { paymentQrUrl: defaultQr } = useClubConfig();
  const [qrUrl, setQrUrl] = useState(defaultQr);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (role && role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  useEffect(() => {
    paymentsApi
      .getConfig()
      .then((c) => {
        if (c?.paymentQrUrl) setQrUrl(c.paymentQrUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localPreview) URL.revokeObjectURL(localPreview);
    setPendingFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const handleSaveQr = async () => {
    if (!pendingFile) {
      toast.error('Seleccione una imagen antes de guardar');
      return;
    }
    setUploading(true);
    try {
      const result = await paymentsApi.uploadQr(pendingFile);
      const url = `${result.paymentQrUrl}?t=${Date.now()}`;
      setQrUrl(url);
      setPendingFile(null);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }
      toast.success('QR de pago guardado correctamente');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo guardar la imagen del QR'));
    } finally {
      setUploading(false);
    }
  };

  if (role !== 'SUPER_ADMIN') {
    return null;
  }

  const serverPreview = resolvePaymentQrUrl(qrUrl || defaultQr);
  const previewSrc = localPreview || serverPreview;

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

        <div className="min-h-[12rem] flex items-center justify-center border rounded-lg p-4 bg-gray-50">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Vista previa QR"
              className="max-h-48 object-contain"
            />
          ) : (
            <p className="text-sm text-gray-400">Sin imagen de QR configurada</p>
          )}
        </div>

        {localPreview && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Imagen seleccionada. Pulse <strong>Guardar QR</strong> para aplicar el cambio.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Elegir imagen (PNG o JPG)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#7c0613] file:text-white"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveQr}
          disabled={uploading || !pendingFile}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white font-medium disabled:opacity-50"
        >
          {uploading ? 'Guardando…' : 'Guardar QR'}
        </button>

        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-gray-700">Alternativa manual:</p>
          <p>
            Coloque el archivo en{' '}
            <code className="bg-white px-1 rounded">frontend/public/images/payment-qr.png</code>
          </p>
        </div>
      </div>
    </div>
  );
}
