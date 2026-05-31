const DEV_FALLBACK = 'SuperSecretKey123456789';

export function getJwtSecretString(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET es obligatorio en producción. Configúralo en las variables de entorno del servidor.',
    );
  }
  return secret || DEV_FALLBACK;
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecretString());
}
