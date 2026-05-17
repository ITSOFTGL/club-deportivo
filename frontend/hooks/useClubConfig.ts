// hooks/useClubConfig.ts
'use client';

interface ClubConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export function useClubConfig(): ClubConfig {
  return {
    name: process.env.NEXT_PUBLIC_CLUB_NAME || 'Club Deportivo',
    logo: process.env.NEXT_PUBLIC_CLUB_LOGO || '/images/club/logo.png',
    primaryColor: '#7c0613',
    secondaryColor: '#4a030b',
  };
}