'use client';

import { useMemo, useState } from 'react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validatePassword } from '@/lib/utils/password';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showHints?: boolean;
  id?: string;
  className?: string;
}

export function PasswordField({
  value,
  onChange,
  label = 'Contraseña',
  placeholder = '••••••••',
  required = false,
  showHints = true,
  id = 'password',
  className = '',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const { checks, valid } = useMemo(() => validatePassword(value), [value]);

  const rules = [
    { key: 'minLength', label: '6 caracteres o más', ok: checks.minLength },
    { key: 'hasLetter', label: 'Al menos una letra', ok: checks.hasLetter },
    { key: 'hasNumber', label: 'Al menos un número', ok: checks.hasNumber },
  ];

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-app pr-11"
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target flex items-center justify-center"
          aria-label={visible ? 'Ocultar' : 'Mostrar'}
        >
          {visible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
      {showHints && value.length > 0 && (
        <ul className="mt-2 space-y-1" aria-live="polite">
          {rules.map((r) => (
            <li
              key={r.key}
              className={`text-xs flex items-center gap-1.5 ${r.ok ? 'text-green-600' : 'text-gray-500'}`}
            >
              <CheckCircleIcon className={`w-3.5 h-3.5 flex-shrink-0 ${r.ok ? 'text-green-600' : 'text-gray-300'}`} />
              {r.label}
            </li>
          ))}
        </ul>
      )}
      {showHints && value.length > 0 && valid && (
        <p className="text-xs text-green-600 mt-1">Contraseña válida</p>
      )}
    </div>
  );
}
