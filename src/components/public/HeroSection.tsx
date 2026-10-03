'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, ArrowRight, TrendingUp, ShieldCheck, Cpu, Handshake } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  heroImage?: string;
}

export function HeroSection({ heroImage }: HeroSectionProps = {}) {
  const { settings } = useBrand();

  const activeHeroImage =
    heroImage || settings.heroImage || '/images/hero-tech-ecosystem.jpg';

  const handleWhatsApp = () => {
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'hero_cta' }),
      });
    } catch (_) {}
    const url = buildWhatsAppLink(
      settings.whatsappNumber,
      settings.whatsappDefaultMessage ||
        'Olá! Gostaria de falar com um especialista sobre soluções TECH7.'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const benefits = [
    {
      icon: <TrendingUp size={18} strokeWidth={1.75} aria-hidden="true" />,
      title: 'MAIS PRODUTIVIDADE',
      desc: 'Processos mais eficientes para melhores resultados.',
    },
    {
      icon: <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />,
      title: 'MAIS SEGURANÇA',
      desc: 'Ambientes tecnológicos mais estáveis e protegidos.',
    },
    {
      icon: <Cpu size={18} strokeWidth={1.75} aria-hidden="true" />,
      title: 'MAIS EFICIÊNCIA',
      desc: 'Soluções adaptadas para a sua realidade.',
    },
    {
      icon: <Handshake size={18} strokeWidth={1.75} aria-hidden="true" />,
      title: 'PARCERIA DE LONGO PRAZO',
      desc: 'Suporte contínuo para o crescimento do seu negócio.',
    },
  ];

  return (
    <section className={styles.hero} aria-label="Seção principal TECH7">
      {/* Full-bleed technology background with dynamic setting */}
      <div
        className={styles.heroBg}
        style={{ backgroundImage: `url('${activeHeroImage}')` }}
        aria-hidden="true"
      />

      {/* Gradient overlay: dark-left to transparent-right */}
      <div className={styles.heroOverlay} aria-hidden="true" />

      {/* CSS-only ambient particles */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={styles.particle} />
        ))}
      </div>

      {/* Main hero content */}
      <div className={styles.heroBody}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.textArea}>

            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              TECNOLOGIA QUE IMPULSIONA NEGÓCIOS
            </p>

            <h1 className={styles.headline}>
              SOLUÇÕES<br />
              INTELIGENTES<br />
              <span className={styles.headlineAccent}>PARA EMPRESAS</span>
            </h1>

            <p className={styles.description}>
              Conectamos tecnologia, eficiência e inovação para transformar o
              potencial do seu negócio em resultados reais.
            </p>

            <div className={styles.ctaRow}>
              <button
                type="button"
                onClick={handleWhatsApp}
                className={styles.btnPrimary}
                id="hero-whatsapp-cta"
                aria-label="Falar com um especialista via WhatsApp"
              >
                <MessageCircle size={17} aria-hidden="true" />
                FALAR COM UM ESPECIALISTA
                <ArrowRight size={14} className={styles.btnArrow} aria-hidden="true" />
              </button>

              <Link
                href="/solucoes"
                className={styles.btnSecondary}
                id="hero-solutions-cta"
                aria-label="Conheça nossas soluções"
              >
                CONHEÇA NOSSAS SOLUÇÕES
                <ArrowRight size={14} className={styles.btnArrow} aria-hidden="true" />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom benefits strip */}
      <div className={styles.benefitsStrip} aria-label="Nossos diferenciais">
        <div className="container">
          <ul className={styles.benefitsGrid} role="list">
            {benefits.map((b, i) => (
              <li key={i} className={styles.benefitItem}>
                <span className={styles.benefitIcon} aria-hidden="true">{b.icon}</span>
                <div>
                  <p className={styles.benefitTitle}>{b.title}</p>
                  <p className={styles.benefitDesc}>{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
