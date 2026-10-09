'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Sidebar drawer state (only used on phones/tablets; desktop always shows the sidebar)
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Se estiver na tela de login, não exibir barra lateral nem cabeçalho
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F8FA' }}>
      <React.Suspense fallback={<aside className="admin-sidebar-placeholder" />}>
        <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      </React.Suspense>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminHeader onMenuClick={() => setMenuOpen(true)} />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
