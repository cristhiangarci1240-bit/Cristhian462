'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ShieldCheck, Lock } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import styles from './Footer.module.css';

export function Footer() {
  const { settings } = useBrand();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        {/* Coluna Marca */}
        <div className={styles.brandCol}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logoUrl || '/brand/logo.svg'}
            alt="TECH7 Electronics"
            className={styles.logoImg}
          />
          <p className={styles.brandDesc}>
            Fornecimento especializado de equipamentos, infraestrutura audiovisual e tecnologia corporativa de ponta para empresas em todo o território nacional.
          </p>
          <div className={styles.guarantee}>
            <ShieldCheck size={15} />
            <span>Garantia Corporativa Homologada</span>
          </div>
        </div>

        {/* Links Rápidos */}
        <div>
          <h4 className={styles.colTitle}>Navegação</h4>
          <ul className={styles.linkList}>
            <li><Link href="/">Início</Link></li>
            <li><Link href="/produtos">Produtos & Catálogo</Link></li>
            <li><Link href="/solucoes">Soluções Corporativas</Link></li>
            <li><Link href="/empresa">Sobre a TECH7</Link></li>
            <li><Link href="/contato">Fale Conosco</Link></li>
          </ul>
        </div>

        {/* Categorias */}
        <div>
          <h4 className={styles.colTitle}>Categorias</h4>
          <ul className={styles.linkList}>
            <li><Link href="/produtos?categoria=celulares">Celulares</Link></li>
            <li><Link href="/produtos?categoria=computadores">Computadores</Link></li>
            <li><Link href="/produtos?categoria=sala-de-conferencias">Sala de conferências</Link></li>
            <li><Link href="/produtos?categoria=brindes-corporativos">Brindes corporativos</Link></li>
          </ul>
        </div>

        {/* Contato & Atendimento */}
        <div>
          <h4 className={styles.colTitle}>Atendimento B2B</h4>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <Phone size={16} />
              <span>{settings.contactPhone}</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} />
              <span>{settings.contactEmail}</span>
            </div>
            <div className={styles.contactItem}>
              <MapPin size={16} />
              <span>{settings.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottomBar}`}>
        <div>
          © {new Date().getFullYear()} TECH7 Electronics Brasil. Todos os direitos reservados. CNPJ Corporativo B2B.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" className={styles.adminLink}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Área Restrita / Painel Administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
}
