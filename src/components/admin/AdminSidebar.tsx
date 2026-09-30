'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users2,
  FileCheck,
  MessageSquare,
  Palette,
  Settings,
  ShieldCheck,
  ExternalLink,
  Video as VideoIcon,
  Star,
} from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import styles from './AdminSidebar.module.css';

export function AdminSidebar() {
  const pathname = usePathname();
  const { settings } = useBrand();

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Produtos', href: '/admin/produtos', icon: <Package size={17} /> },
    { label: 'Categorias', href: '/admin/categorias', icon: <Layers size={17} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users2 size={17} /> },
    { label: 'Vídeos', href: '/admin/videos', icon: <VideoIcon size={17} /> },
    { label: 'Avaliações', href: '/admin/avaliacoes', icon: <Star size={17} /> },
    { label: 'Pedidos / Consultas', href: '/admin/whatsapp', icon: <FileCheck size={17} /> },
    { label: 'WhatsApp', href: '/admin/whatsapp', icon: <MessageSquare size={17} /> },
    { label: 'Aparência', href: '/admin/aparencia', icon: <Palette size={17} /> },
    { label: 'Configuração', href: '/admin/configuracao', icon: <Settings size={17} /> },
    { label: 'Usuários', href: '/admin/usuarios', icon: <ShieldCheck size={17} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.logoUrl || '/brand/logo.svg'}
          alt="TECH7 Electronics"
          className={styles.logoImg}
        />
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item, idx) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={idx}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/" target="_blank" className={styles.publicLink}>
          <span>Ver Site Público</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </aside>
  );
}
