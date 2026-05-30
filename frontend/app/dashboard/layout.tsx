'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    const mq = window.matchMedia('(max-width: 767px)');

    const checkMobile = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();
    mq.addEventListener('change', checkMobile);
    return () => mq.removeEventListener('change', checkMobile);
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="app-shell-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50">
      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 md:hidden border-0 cursor-default"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[auto_1fr]">
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isMobile={isMobile}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 md:p-6 md:pb-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
