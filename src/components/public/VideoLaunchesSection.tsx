'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { Video } from '@/lib/types';
import styles from './VideoLaunchesSection.module.css';

interface VideoLaunchesSectionProps {
  videos: Video[];
}

export function VideoLaunchesSection({ videos }: VideoLaunchesSectionProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Filter only active videos and sort by order
  const activeVideos = (videos || [])
    .filter((v) => v.isActive)
    .sort((a, b) => a.order - b.order);

  // Check scroll boundary to enable/disable buttons
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
  }, [checkScrollBounds, activeVideos.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const cardWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).clientWidth + 20
      : 300;
    const offset = direction === 'left' ? -cardWidth * 1.5 : cardWidth * 1.5;
    container.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const togglePlay = (id: string) => {
    if (playingId === id) {
      // Pause current
      const curr = videoRefs.current[id];
      if (curr) curr.pause();
      setPlayingId(null);
    } else {
      // Pause any previously playing video
      if (playingId && videoRefs.current[playingId]) {
        videoRefs.current[playingId]?.pause();
      }

      setPlayingId(id);

      // Play target video
      setTimeout(() => {
        const next = videoRefs.current[id];
        if (next) {
          next.currentTime = 0;
          next.play().catch(() => {
            // Browser autoplay prevention fallback
            console.log('Autoplay deferred until explicit click');
          });
        }
      }, 50);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  if (!activeVideos || activeVideos.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} id="novos-lancamentos">
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className="container">
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>NOVOS LANÇAMENTOS</span>
            </div>
            <h2 className={styles.title}>
              Conheça nossas <span className={styles.titleHighlight}>novidades</span>
            </h2>
            <p className={styles.subtitle}>
              Confira os lançamentos, novidades e soluções que estão chegando à TECH7 Electronics.
            </p>
          </div>

          {/* Navigation Controls */}
          {activeVideos.length > 2 && (
            <div className={styles.navControls}>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className={styles.navBtn}
                aria-label="Vídeos anteriores"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={styles.navBtn}
                aria-label="Próximos vídeos"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Carousel */}
        <div className={styles.carouselWrapper}>
          <div className={styles.track} ref={trackRef}>
            {activeVideos.map((video) => {
              const isPlaying = playingId === video.id;

              return (
                <div
                  key={video.id}
                  className={`${styles.card} ${isPlaying ? styles.cardActive : ''}`}
                  onClick={() => togglePlay(video.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePlay(video.id);
                    }
                  }}
                  aria-label={`${isPlaying ? 'Pausar' : 'Assistir'}: ${video.title}`}
                >
                  {/* Video Player */}
                  <video
                    ref={(el) => {
                      videoRefs.current[video.id] = el;
                    }}
                    src={video.videoUrl}
                    poster={video.thumbnailUrl || undefined}
                    playsInline
                    muted={isMuted}
                    loop
                    preload="none"
                    className={styles.videoPlayer}
                  />

                  {/* Poster Image (shown when not playing) */}
                  {!isPlaying && video.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className={styles.posterImage}
                      loading="lazy"
                    />
                  )}

                  {/* Cinematic gradient overlay */}
                  <div className={styles.gradientOverlay} />

                  {/* Card Header (Category tag) */}
                  <div className={styles.cardHeader}>
                    <span className={styles.badge}>
                      <Sparkles size={11} style={{ marginRight: '2px' }} />
                      {video.category || 'LANÇAMENTO'}
                    </span>

                    {isPlaying && (
                      <div className={styles.liveIndicator}>
                        <span className={styles.liveDot} />
                        <span>NO AR</span>
                      </div>
                    )}
                  </div>

                  {/* Center Play Button Overlay (when paused) */}
                  {!isPlaying && (
                    <div className={styles.playOverlay}>
                      <div className={styles.playCircle}>
                        <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
                      </div>
                    </div>
                  )}

                  {/* Controls bar (when playing) */}
                  {isPlaying && (
                    <div className={styles.controlsBar} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.controlBtn}
                        onClick={() => togglePlay(video.id)}
                        aria-label="Pausar vídeo"
                      >
                        <Pause size={14} fill="currentColor" />
                      </button>

                      <button
                        type="button"
                        className={styles.controlBtn}
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  )}

                  {/* Bottom Text Content */}
                  <div className={styles.cardFooter}>
                    <h3 className={styles.cardTitle}>{video.title}</h3>
                    {video.description && !isPlaying && (
                      <p className={styles.cardDesc}>{video.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
