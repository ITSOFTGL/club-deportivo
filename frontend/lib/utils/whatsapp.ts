export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('591')) return digits;
  if (digits.length === 8) return `591${digits}`;
  return digits;
}

export function buildBirthdayWhatsAppUrl(
  phone: string,
  studentName: string,
  age: number,
  clubName = 'Club Deportivo',
): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const text = `¡Feliz cumpleaños ${studentName}! 🎂🎉

Desde ${clubName} le deseamos un día maravilloso en sus ${age} años.

¡Muchas felicidades! ⚽`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
