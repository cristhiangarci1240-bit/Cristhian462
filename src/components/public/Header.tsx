'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, Search, Menu, X, ArrowRight, Lock } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Header.module.css';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useBrand();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: 'Início', href: '/' },
    { label: 'Produtos', href: '/produtos' },
    { label: 'Soluções', href: '/solucoes' },
    { label: 'Empresa', href: '/empresa' },
    { label: 'Contato', href: '/contato' },
  ];

  const handleWhatsApp = async () => {
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'header' }),
      });
    } catch (_) {}

    const url = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/produtos?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo Oficial TECH7 */}
        <Link href="/" className={styles.logoArea} aria-label="TECH7 Electronics">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logoUrl || '/brand/logo.svg'}
            alt="TECH7 Electronics"
            className={styles.logoImg}
          />
        </Link>

        {/* Grupo de Navegação & Busca */}
        <div className={styles.navGroup}>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Botão de Busca */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={styles.searchBtn}
            title="Pesquisar equipamentos"
            aria-label="Pesquisar"
          >
            <Search size={18} />
          </button>
        </div>

        {/* CTA WhatsApp, Área interna & Mobile Toggle */}
        <div className={styles.actions}>
          {/* Discreet internal access — desktop only */}
          <Link
            href="/admin/login"
            className={styles.internalLink}
            aria-label="Acessar área interna"
            title="Área interna"
          >
            <Lock size={13} aria-hidden="true" />
            <span>Área interna</span>
          </Link>

          <button
            onClick={handleWhatsApp}
            className={styles.whatsappBtn}
            id="header-whatsapp-cta"
          >
            <MessageCircle size={17} fill="#0B0F14" stroke="none" />
            <span>Consultar pelo WhatsApp</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={styles.mobileToggle}
            aria-label="Abrir menu mobile"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Barra de Busca Expansível */}
      {searchOpen && (
        <form onSubmit={handleSearchSubmit} className={`container ${styles.searchBar}`}>
          <Search size={16} color="var(--brand-primary)" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite o nome, modelo ou categoria do equipamento e pressione Enter..."
            className={styles.searchInput}
          />
          <button type="submit" className="btn btn-whatsapp-ref" style={{ padding: '7px 14px', fontSize: '13px' }}>
            Buscar
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </form>
      )}

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={styles.navLink}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className={styles.navLink}
            style={{ color: '#64748B', fontSize: '13px' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Acessar área interna"
          >
            <Lock size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} aria-hidden="true" />
            Área interna
          </Link>
        </div>
      )}
    </header>
  );
}
