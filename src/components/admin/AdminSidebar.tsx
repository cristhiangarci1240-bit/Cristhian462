'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Mail,
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Megaphone,
  Receipt,
} from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import styles from './AdminSidebar.module.css';

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFolder = searchParams.get('folder') || 'inbox';
  const { settings } = useBrand();

  const emailSubItems = [
    { label: 'Caixa de entrada', folder: 'inbox', href: '/admin/email?folder=inbox', icon: <Inbox size={14} /> },
    { label: 'Enviados', folder: 'sent', href: '/admin/email?folder=sent', icon: <Send size={14} /> },
    { label: 'Rascunhos', folder: 'drafts', href: '/admin/email?folder=drafts', icon: <FileEdit size={14} /> },
    { label: 'Favoritos', folder: 'starred', href: '/admin/email?folder=starred', icon: <Star size={14} /> },
    { label: 'Lixeira', folder: 'trash', href: '/admin/email?folder=trash', icon: <Trash2 size={14} /> },
    { label: 'Campanhas', folder: 'campaigns', href: '/admin/email?folder=campaigns', icon: <Megaphone size={14} /> },
    { label: 'Configurações', folder: 'settings', href: '/admin/email?folder=settings', icon: <Settings size={14} /> },
  ];

  const fiscalSubItems = [
    { label: 'Fazer Nota Fiscal', href: '/admin/fiscal/emissor', icon: <Receipt size={14} /> },
  ];

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Produtos', href: '/admin/produtos', icon: <Package size={17} /> },
    { label: 'Categorias', href: '/admin/categorias', icon: <Layers size={17} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users2 size={17} /> },
    { label: 'Pedidos / Consultas', href: '/admin/whatsapp', icon: <FileCheck size={17} /> },
    { label: 'E-mail', href: '/admin/email', icon: <Mail size={17} />, isEmail: true },
    { label: 'Fiscal', href: '/admin/fiscal', icon: <Receipt size={17} />, isFiscal: true },
    { label: 'Vídeos', href: '/admin/videos', icon: <VideoIcon size={17} /> },
    { label: 'Avaliações', href: '/admin/avaliacoes', icon: <Star size={17} /> },
    { label: 'WhatsApp', href: '/admin/whatsapp', icon: <MessageSquare size={17} /> },
    { label: 'Aparência', href: '/admin/aparencia', icon: <Palette size={17} /> },
    { label: 'Configuração', href: '/admin/configuracao', icon: <Settings size={17} /> },
    { label: 'Usuários', href: '/admin/usuarios', icon: <ShieldCheck size={17} /> },
  ];

  const isEmailActive = pathname.startsWith('/admin/email');
  const isFiscalActive = pathname.startsWith('/admin/fiscal');

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
            <React.Fragment key={idx}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
              {item.isEmail && isEmailActive && (
                <div className={styles.subNav}>
                  {emailSubItems.map((sub, sIdx) => {
                    const isSubActive = currentFolder === sub.folder;
                    return (
                      <Link
                        key={sIdx}
                        href={sub.href}
                        className={`${styles.subItem} ${isSubActive ? styles.subItemActive : ''}`}
                      >
                        {sub.icon}
                        <span style={{ marginLeft: 6 }}>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              {item.isFiscal && isFiscalActive && (
                <div className={styles.subNav}>
                  {fiscalSubItems.map((sub, sIdx) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sIdx}
                        href={sub.href}
                        className={`${styles.subItem} ${isSubActive ? styles.subItemActive : ''}`}
                      >
                        {sub.icon}
                        <span style={{ marginLeft: 6 }}>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
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
