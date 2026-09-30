'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Review } from '@/lib/types';
import styles from './ReviewsSection.module.css';

interface ReviewsSectionProps {
  reviews: Review[];
}

function getInitials(name: string): string {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);

  // Filter only active reviews and sort by order
  const activeReviews = (reviews || [])
    .filter((r) => r.isActive)
    .sort((a, b) => a.order - b.order);

  const checkScrollBounds = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScrollBounds();
    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, activeReviews.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const card = container.firstElementChild as HTMLElement;
    const cardWidth = card ? card.clientWidth + 20 : 320;
    const offset = direction === 'left' ? -cardWidth : cardWidth;
    container.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Subtle auto-scroll every 5.5s if not hovered and prefers-reduced-motion is false
  useEffect(() => {
    if (activeReviews.length <= 3 || isPaused) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      if (!trackRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 15) {
        // loop back to start smoothly
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        handleScroll('right');
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [activeReviews.length, isPaused]);

  if (!activeReviews || activeReviews.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.section}
      id="avaliacoes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* Header */}
        <div className={styles.headerContainer}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>AVALIAÇÕES DE CLIENTES</span>
            </div>
            <h2 className={styles.title}>
              O que nossos <span className={styles.titleHighlight}>clientes dizem</span>
            </h2>
            <p className={styles.subtitle}>
              Experiências reais de clientes que escolheram a TECH7 para suas necessidades de tecnologia.
            </p>
          </div>

          {/* Navigation Controls */}
          {activeReviews.length > 1 && (
            <div className={styles.navControls}>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className={styles.navBtn}
                aria-label="Avaliações anteriores"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={styles.navBtn}
                aria-label="Próximas avaliações"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Track */}
        <div className={styles.carouselWrapper}>
          <div className={styles.track} ref={trackRef}>
            {activeReviews.map((rev) => (
              <div key={rev.id} className={styles.card}>
                <div>
                  {/* Top Customer info */}
                  <div className={styles.cardHeader}>
                    {rev.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.avatarUrl}
                        alt={`Foto de ${rev.customerName}`}
                        className={styles.avatar}
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken image and fallback to initials
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {getInitials(rev.customerName)}
                      </div>
                    )}

                    <div className={styles.customerInfo}>
                      <div className={styles.customerName}>{rev.customerName}</div>
                      {rev.companyName && (
                        <div className={styles.companyName}>{rev.companyName}</div>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className={styles.ratingRow} aria-label={`Avaliação: ${rev.rating} de 5 estrelas`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        fill={star <= rev.rating ? 'currentColor' : 'none'}
                        className={star <= rev.rating ? styles.starFilled : styles.starEmpty}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className={styles.comment}>
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Footer with verification and date */}
                <div className={styles.cardFooter}>
                  {rev.isVerified ? (
                    <span className={styles.verifiedBadge}>
                      <CheckCircle2 size={13} />
                      <span>Cliente verificado</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  {rev.reviewDate && (
                    <span className={styles.reviewDate}>{rev.reviewDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
