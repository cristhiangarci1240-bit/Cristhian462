import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSettings, getCategories, getProducts, getClients, getVideos, getReviews } from '@/lib/db';
import { HeroSection } from '@/components/public/HeroSection';
import { ClientGrid } from '@/components/public/ClientGrid';
import { CategoryCard } from '@/components/public/CategoryCard';
import { VideoLaunchesSection } from '@/components/public/VideoLaunchesSection';
import { ReviewsSection } from '@/components/public/ReviewsSection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [settings, categories, products, clients, videos, reviews] = await Promise.all([
    getSettings(),
    getCategories({ isActive: true }),
    getProducts({ isActive: true, sortBy: 'order' }),
    getClients({ isActive: true }),
    getVideos({ isActive: true, sortBy: 'order' }),
    getReviews({ isActive: true, sortBy: 'order' }),
  ]);

  return (
    <div>
      {/* 1. Hero (con imagen configurada dinámicamente) */}
      <HeroSection heroImage={settings.heroImage} />

      {/* 2. Parceiros e Clientes (Quem confia na TECH7) */}
      <ClientGrid clients={clients} />

      {/* 3. Nossas Categorias */}
      <section className="categoriesSection" style={{ padding: '80px 0 88px', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '10px',
            }}>
              Portfólio de Produtos
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: '10px' }}>
                  Nossas{' '}
                  <span style={{ color: 'var(--brand-primary)' }}>categorias</span>
                </h2>
                <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6 }}>
                  Tecnologia selecionada para cada necessidade da sua empresa.
                </p>
              </div>
              <Link
                href="/produtos"
                style={{
                  color: '#0F172A',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  borderBottom: '1px solid #CBD5E1',
                  paddingBottom: '2px',
                  transition: 'color 150ms, border-color 150ms',
                }}
              >
                <span>Ver todas as categorias</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1px',
            backgroundColor: '#E2E8F0',
            border: '1px solid #E2E8F0',
          }}>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return <CategoryCard key={cat.id} category={cat} productCount={count} />;
            })}
          </div>
        </div>
      </section>

      {/* 4. Novos Lançamentos (Vídeos) */}
      <VideoLaunchesSection videos={videos} />

      {/* 5. Avaliações de Clientes (Social Proof) */}
      <ReviewsSection reviews={reviews} />
    </div>
  );
}
