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

  if (Array.isArray(e.message)) return e.message.join(', ');
  if (typeof e.message === 'string' && e.message.trim()) return e.message;

  // axios sin interceptor (fetch directo)
  const nested = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;
  if (Array.isArray(nested)) return nested.join(', ');
  if (typeof nested === 'string' && nested.trim()) return nested;

  if (typeof e.error === 'string' && e.error.trim()) return e.error;

  return fallback;
}
