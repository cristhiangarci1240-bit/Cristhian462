'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Building2 } from 'lucide-react';
import styles from './AdminHeader.module.css';

export function AdminHeader() {
  const router = useRouter();

  // ── Logout logic unchanged ──
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (_) {
      router.push('/admin/login');
    }
  };

  return (
    <header className={styles.header}>
      {/* Left: brand context */}
      <div className={styles.breadcrumb}>
        <Building2 size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--brand-primary)' }} />
        Painel Administrativo TECH7
      </div>

      {/* Right: user profile + logout */}
      <div className={styles.userProfile}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          alt="Administrador TECH7"
          className={styles.avatar}
        />
        <div className={styles.userInfo}>
          <span className={styles.userName}>Administrador</span>
          <span className={styles.userEmail}>admin@tech7.com.br</span>
        </div>

        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Encerrar sessão"
          id="btn-admin-logout"
        >
          <LogOut size={13} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
