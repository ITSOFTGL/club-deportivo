// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4500,
          style: { maxWidth: '420px' },
        }}
      />
    </SessionProvider>
  );
}