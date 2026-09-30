'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  category?: Category;
}

export function ProductCard({ product }: ProductCardProps) {
  const { settings } = useBrand();

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'product_card',
          productId: product.id,
          productName: product.name,
        }),
      });
    } catch (_) {}

    const url = buildWhatsAppLink(
      settings.whatsappNumber,
      settings.whatsappProductMessage,
      product.name
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Linha "MARCA | SKU" idêntica à referência ("APPLE | IP15P-256")
  const brandLabel = product.brand ? product.brand.toUpperCase() : 'TECH7';
  const skuLabel = product.sku || product.model || 'B2B';
  const metaText = `${brandLabel} | ${skuLabel}`;

  return (
    <div className={styles.card}>
      <Link href={`/produtos/${product.slug}`} className={styles.imageArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.mainImage}
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />
      </Link>

      <div className={styles.body}>
        <h4 className={styles.title}>
          <Link href={`/produtos/${product.slug}`}>{product.name}</Link>
        </h4>

        <div className={styles.metaLine}>{metaText}</div>

        <button
          onClick={handleWhatsApp}
          className={styles.whatsappBtn}
          title={`Consultar ${product.name} pelo WhatsApp`}
        >
          <MessageCircle size={16} fill="#0B0F14" stroke="none" />
          <span>Consultar pelo WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
