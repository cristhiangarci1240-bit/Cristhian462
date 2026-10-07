'use client';

import React from 'react';
import { Client } from '@/lib/types';
import { DEFAULT_PARTNERS } from '@/lib/partners';
import styles from './ClientGrid.module.css';

interface ClientGridProps {
  clients: Client[];
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  ariaLabel?: string;
  direction?: 'left' | 'right';
}

export function ClientGrid({
  clients,
  title = 'Quem confia na',
  titleAccent = 'TECH7',
  subtitle = 'Empresas, profissionais e clientes que escolheram a TECH7 para suas soluções de tecnologia.',
  ariaLabel = 'Parceiros e clientes',
  direction = 'right',
}: ClientGridProps) {
  const rawList = clients && clients.length > 0
    ? clients.filter((c) => c.isActive)
    : DEFAULT_PARTNERS.map((p, i) => ({
        id: `p_${i}`,
        name: p.name,
        logo: p.logo,
        isActive: true,
        order: i,
        createdAt: '',
        updatedAt: '',
        website: p.website,
      }));

  // Duplicate list for seamless infinite loop
  const marqueeList = [...rawList, ...rawList, ...rawList];

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>
            {title} <span className={styles.titleAccent}>{titleAccent}</span>
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      {/* Marquee track — spans full viewport width, outside container */}
      <div
        className={styles.marqueeWrapper}
        onMouseEnter={(e) => {
          const track = e.currentTarget.querySelector(`.${styles.marqueeTrack}`) as HTMLElement | null;
          if (track) track.style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          const track = e.currentTarget.querySelector(`.${styles.marqueeTrack}`) as HTMLElement | null;
          if (track) track.style.animationPlayState = 'running';
        }}
        aria-hidden="true"
      >
        <div className={`${styles.marqueeTrack} ${direction === 'left' ? styles.marqueeLeft : ''}`}>
          {marqueeList.map((client, idx) => {
            const logoEl = client.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logo}
                alt={client.name}
                className={styles.logo}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.className = styles.logoText;
                    span.textContent = client.name;
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              <span className={styles.logoText}>{client.name}</span>
            );

            return client.website ? (
              <a
                key={`${client.id}-${idx}`}
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className={styles.logoItem}
                title={client.name}
              >
                {logoEl}
              </a>
            ) : (
              <div
                key={`${client.id}-${idx}`}
                className={styles.logoItem}
                title={client.name}
              >
                {logoEl}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible static version for reduced-motion */}
      <div className={styles.staticGrid} aria-label={`Lista: ${ariaLabel}`}>
        {rawList.map((client) => (
          <div key={client.id} className={styles.staticItem}>
            {client.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logo} alt={client.name} className={styles.logo} loading="lazy" />
            ) : (
              <span className={styles.logoText}>{client.name}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
