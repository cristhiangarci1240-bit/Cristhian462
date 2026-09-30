import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/lib/types';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
  productCount: number;
}

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  // Imagens alinhadas à referência
  const fallbackImages: Record<string, string> = {
    'celulares': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    'computadores': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80',
    'sala-de-conferencias': 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
    'brindes-corporativos': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  };

  const imageSrc = category.image || fallbackImages[category.slug] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';

  return (
    <div className={styles.card}>
      <div className={styles.imageArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={category.name}
          className={styles.image}
          loading="lazy"
        />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{category.name}</h3>
        <p className={styles.desc}>{category.description}</p>
        <div className={styles.countBadge}>
          {productCount} {productCount === 1 ? 'produto' : 'produtos'}
        </div>

        <Link
          href={`/produtos?categoria=${category.slug}`}
          className={styles.btnAction}
        >
          <span>Ver produtos</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
