const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

export function resolveMediaUrl(
  path?: string | null,
  cacheBust?: string | number,
): string | null {
  if (!path?.trim()) return null;
  const base = API_BASE.replace(/\/api\/?$/, '');
  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path.split('?')[0];
  } else {
    url = `${base}${path.startsWith('/') ? path.split('?')[0] : `/${path.split('?')[0]}`}`;
  }
  if (cacheBust != null) {
    return `${url}?v=${cacheBust}`;
  }
  return url;
}
