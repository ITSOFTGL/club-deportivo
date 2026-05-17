import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de Turbopack para desarrollo
  turbopack: {
    // Establece la raíz del proyecto para evitar warnings de lockfiles
    root: process.cwd(),
  },
  
  // Configuración general
  reactStrictMode: true,
  
  // Variables de entorno que estarán disponibles en el cliente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Imágenes permitidas (si usas next/image con URLs externas)
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;