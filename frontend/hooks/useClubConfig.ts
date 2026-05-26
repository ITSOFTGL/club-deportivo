// hooks/useClubConfig.ts
'use client';

interface ClubConfig {
  name: string;
  logo: string;
  paymentQrUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export function useClubConfig(): ClubConfig {
  return {
    name: process.env.NEXT_PUBLIC_CLUB_NAME || 'Club Deportivo',
    logo: process.env.NEXT_PUBLIC_CLUB_LOGO || '/images/club/logo.png',
    paymentQrUrl:
      process.env.NEXT_PUBLIC_PAYMENT_QR_URL || '/images/payment-qr.png',
    primaryColor: '#7c0613',
    secondaryColor: '#4a030b',
  };
}