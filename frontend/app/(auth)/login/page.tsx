'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ClubLogo from '@/components/ui/ClubLogo';
import { useClubConfig } from '@/hooks/useClubConfig';
import { getApiErrorMessage } from '@/lib/apiError';

const showDemoLogin = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true';

const demoCredentials = [
  { role: 'Super Admin', email: 'superadmin@club.com', password: '123456' },
  { role: 'Admin', email: 'admin@club.com', password: '123456' },
  { role: 'Profesor', email: 'profesor@club.com', password: '123456' },
  { role: 'Cobrador', email: 'cobrador@club.com', password: '123456' },
  { role: 'Padre', email: 'padre@club.com', password: '123456' },
];

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001'
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { name: clubName } = useClubConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Ingrese su correo electrónico');
      return;
    }
    if (!password) {
      toast.error('Ingrese su contraseña');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          getApiErrorMessage(data, 'Correo o contraseña incorrectos'),
        );
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('No se pudo iniciar sesión. Intente de nuevo.');
      } else {
        toast.success('Bienvenido');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error(
        'No se pudo conectar con el servidor. Verifique su conexión o contacte al administrador.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#7c0613] via-[#4a030b] to-[#2a0206] px-4 py-8 safe-top safe-bottom">
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full">
          <div className="text-center mb-8">
            <ClubLogo size="xl" className="justify-center" textPosition="bottom" showText />
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              {clubName || 'Club Deportivo'} — Acceso al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-app"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-app pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-club disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {showDemoLogin && (
            <details className="mt-6 text-sm">
              <summary className="text-gray-500 cursor-pointer text-center">
                Acceso de prueba (solo desarrollo)
              </summary>
              <div className="mt-3 space-y-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-[#7c0613] text-gray-700"
                  >
                    {cred.role}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>

        <p className="text-center text-white/70 text-xs mt-6">
          © {new Date().getFullYear()} {clubName || 'Club Deportivo'}
        </p>
      </div>
    </div>
  );
}
