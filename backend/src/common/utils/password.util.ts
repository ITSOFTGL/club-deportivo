export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 6 caracteres, incluir una letra y un número';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  checks: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    /** Recomendado, no obligatorio */
    strongExtra: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: (password?.length ?? 0) >= 6,
    hasLetter: /[a-zA-Z]/.test(password ?? ''),
    hasNumber: /\d/.test(password ?? ''),
    strongExtra:
      (password?.length ?? 0) >= 8 &&
      /[A-Z]/.test(password ?? '') &&
      ((password ?? '').match(/\d/g) ?? []).length >= 1 &&
      SPECIAL_CHARS.test(password ?? ''),
  };

  const valid = checks.minLength && checks.hasLetter && checks.hasNumber;

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
