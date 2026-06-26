const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

/** Convierte rutas /uploads/... en URL absoluta del API. Respeta blob/data y URLs absolutas. */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const p = path.trim();
  if (
    p.startsWith('blob:') ||
    p.startsWith('data:') ||
    p.startsWith('http://') ||
    p.startsWith('https://')
  ) {
    return p;
  }
  if (p.startsWith('/')) return `${API_BASE}${p}`;
  return `${API_BASE}/${p}`;
}

/** Añade cache-bust si la URL es del API y no tiene query. */
export function withCacheBust(url?: string, version?: string | number): string | undefined {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.includes('?')) return url;
  const v = version ?? Date.now();
  return `${url}?v=${v}`;
}
