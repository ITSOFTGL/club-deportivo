export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Mínimo 8 caracteres, 1 mayúscula, 2 números y 1 carácter especial';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export interface PasswordChecks {
  minLength: boolean;
  uppercase: boolean;
  twoNumbers: boolean;
  special: boolean;
}

export function validatePassword(password: string): {
  valid: boolean;
  message: string;
  checks: PasswordChecks;
} {
  const checks: PasswordChecks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    twoNumbers: (password.match(/\d/g) ?? []).length >= 2,
    special: SPECIAL_CHARS.test(password),
  };

  const valid =
    checks.minLength &&
    checks.uppercase &&
    checks.twoNumbers &&
    checks.special;

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
