/**
 * Algunos proxies/WAF bloquean la ruta `/users` (401).
 * Reescribe a `/usuarios` aunque un bundle antiguo aún llame `/users`.
 */
export function rewriteUsersApiPath(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.replace(/\/users(?=\/|$|\?)/g, '/usuarios');
}
