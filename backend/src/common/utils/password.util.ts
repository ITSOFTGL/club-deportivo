export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 2 números y 1 carácter especial';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    twoNumbers: boolean;
    special: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: (password?.length ?? 0) >= 8,
    uppercase: /[A-Z]/.test(password ?? ''),
    twoNumbers: ((password ?? '').match(/\d/g) ?? []).length >= 2,
    special: SPECIAL_CHARS.test(password ?? ''),
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

export function assertStrongPassword(password: string): void {
  const result = validatePassword(password);
  if (!result.valid) {
    throw new Error(result.message);
  }
}
