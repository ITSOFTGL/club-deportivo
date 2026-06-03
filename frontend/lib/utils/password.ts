export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Mínimo 6 caracteres, al menos una letra y un número';

export interface PasswordChecks {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  strongExtra: boolean;
}

export function validatePassword(password: string): {
  valid: boolean;
  message: string;
  checks: PasswordChecks;
} {
  const checks: PasswordChecks = {
    minLength: password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    strongExtra:
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };

  const valid = checks.minLength && checks.hasLetter && checks.hasNumber;

  return {
    valid,
    message: valid ? '' : PASSWORD_REQUIREMENTS_MESSAGE,
    checks,
  };
}

export function requirePassword(password: string, fieldLabel = 'La contraseña'): string | null {
  const { valid, message } = validatePassword(password);
  if (!valid) return `${fieldLabel}: ${message}`;
  return null;
}
