const STATUS_HINTS: Record<number, string> = {
  401: 'Sesión expirada o sin autorización. Cierre sesión y vuelva a ingresar.',
  403: 'No tiene permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'No se puede completar la operación por un conflicto con datos existentes.',
  500: 'Error en el servidor. Intente de nuevo o contacte al administrador.',
};

/** Mensaje legible desde respuesta de error del API (axios interceptor rechaza response.data) */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error',
): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const e = error as {
    message?: string | string[];
    error?: string;
    statusCode?: number;
  };

  const statusCode =
    e.statusCode ??
    (error as { response?: { status?: number } }).response?.status;

  if (Array.isArray(e.message)) return e.message.join(', ');
  if (typeof e.message === 'string' && e.message.trim()) return e.message;

  // axios sin interceptor (fetch directo)
  const nested = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;
  if (Array.isArray(nested)) return nested.join(', ');
  if (typeof nested === 'string' && nested.trim()) return nested;

  if (typeof e.error === 'string' && e.error.trim()) return e.error;

  if (statusCode && STATUS_HINTS[statusCode]) {
    return STATUS_HINTS[statusCode];
  }

  return fallback;
}
