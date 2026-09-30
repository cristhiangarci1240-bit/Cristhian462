'use client';

import React, { useState } from 'react';
import { MessageSquare, MessageCircle } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './WhatsAppFloating.module.css';

export function WhatsAppFloating() {
  const { settings } = useBrand();
  const [hovered, setHovered] = useState(false);

  const handleClick = async () => {
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'floating_button' }),
      });
    } catch (_) {}

    const url = buildWhatsAppLink(
      settings.whatsappNumber,
      settings.whatsappDefaultMessage
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={styles.floatingContainer}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className={styles.tooltip}>
          <div className="tech-badge-dot" />
          <span>Falar com especialista agora</span>
        </div>
      )}
      <button
        onClick={handleClick}
        className={styles.floatingButton}
        aria-label="Atendimento corporativo via WhatsApp"
        id="floating-whatsapp-btn"
      >
        <span className={styles.pulseDot} />
        <MessageCircle size={30} fill="#070A0E" stroke="none" />
      </button>
    </div>
  );
}
