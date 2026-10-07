'use client';

import React from 'react';
import { Client } from '@/lib/types';
import styles from './ClientGrid.module.css';

interface ClientGridProps {
  clients: Client[];
}

export function ClientGrid({ clients }: ClientGridProps) {
  const defaultPartners = [
    { name: 'IVECO GROUP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Iveco_Group_Logo.svg/320px-Iveco_Group_Logo.svg.png' },
    { name: 'SAMSUNG',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/320px-Samsung_Logo.svg.png' },
    { name: 'DELL',       logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dell_logo_2016.svg/320px-Dell_logo_2016.svg.png' },
    { name: 'Lenovo',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Lenovo_Global_Corporate_Logo.png/320px-Lenovo_Global_Corporate_Logo.png' },
    { name: 'HP',         logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/320px-HP_logo_2012.svg.png' },
    { name: 'Logitech',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/320px-Logitech_logo.svg.png' },
    { name: 'Microsoft',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/320px-Microsoft_logo_%282012%29.svg.png' },
    { name: 'UBIQUITI',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Ubiquiti_Networks_Logo.svg/320px-Ubiquiti_Networks_Logo.svg.png' },
  ];

  const rawList = clients && clients.length > 0
    ? clients.filter((c) => c.isActive)
    : defaultPartners.map((p, i) => ({
        id: `p_${i}`,
        name: p.name,
        logo: p.logo,
        isActive: true,
        order: i,
        createdAt: '',
        updatedAt: '',
        website: undefined as string | undefined,
      }));

  // Duplicate list for seamless infinite loop
  const marqueeList = [...rawList, ...rawList, ...rawList];

  return (
    <section className={styles.section} aria-label="Parceiros e clientes">
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>
            Quem confia na <span className={styles.titleAccent}>TECH7</span>
          </h2>
          <p className={styles.subtitle}>
            Empresas, profissionais e clientes que escolheram a TECH7 para suas soluções de tecnologia.
          </p>
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
        <div className={styles.marqueeTrack}>
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
      <div className={styles.staticGrid} aria-label="Lista de parceiros">
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
