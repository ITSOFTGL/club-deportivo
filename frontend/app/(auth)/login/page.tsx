// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ClubLogo from '@/components/ui/ClubLogo';
import { useClubConfig } from '@/hooks/useClubConfig';

const credentials = [
  { role: 'Super Admin', email: 'superadmin@club.com', password: '123456', color: 'bg-purple-600' },
  { role: 'Admin', email: 'admin@club.com', password: '123456', color: 'bg-blue-600' },
  { role: 'Profesor', email: 'profesor@club.com', password: '123456', color: 'bg-green-600' },
  { role: 'Cobrador', email: 'cobrador@club.com', password: '123456', color: 'bg-yellow-600' },
  { role: 'Padre', email: 'padre@club.com', password: '123456', color: 'bg-pink-600' },
];

export default function LoginPage() {
  const router = useRouter();
  const { name: clubName, primaryColor, secondaryColor } = useClubConfig();
  const [email, setEmail] = useState('superadmin@club.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Credenciales incorrectas');
      } else {
        toast.success('Bienvenido al sistema');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7c0613] via-[#4a030b] to-[#2a0206]">
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 w-full max-w-6xl mx-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulario de Login */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {/* Logo y título del club */}
            <div className="text-center mb-8">
              <ClubLogo size="xl" className="justify-center" textPosition="bottom" showText />
              <p className="text-gray-500 mt-2">Sistema de Gestión Deportiva</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#7c0613] mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent transition"
                  placeholder="correo@club.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7c0613] mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent transition pr-10"
                    placeholder="••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7c0613] to-[#4a030b] hover:from-[#8e0716] hover:to-[#5c040e] text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
              </button>
            </form>
          </div>

          {/* Panel de Credenciales Rápidas */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-[#7c0613] mb-4 text-center">Acceso Rápido</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Selecciona un rol para probar el sistema</p>
            
            <div className="space-y-3">
              {credentials.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => quickLogin(cred.email, cred.password)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#7c0613] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${cred.color} rounded-full`} />
                    <span className="font-medium text-gray-700">{cred.role}</span>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-[#7c0613]">{cred.email}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-[#7c0613] text-center">
                🔐 Todas las cuentas usan la contraseña: <strong>123456</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}