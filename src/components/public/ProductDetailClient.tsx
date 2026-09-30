'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './ProductDetailClient.module.css';

interface ProductDetailClientProps {
  product: Product;
  category?: Category | null;
}

export function ProductDetailClient({ product, category }: ProductDetailClientProps) {
  const { settings } = useBrand();

  const allImages = [product.mainImage, ...(product.galleryImages || [])].filter(Boolean);
  const [selectedImage, setSelectedImage] = useState(allImages[0] || product.mainImage);

  const handleWhatsApp = async () => {
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'product_detail',
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

  const brandLabel = product.brand ? product.brand.toUpperCase() : 'TECH7';
  const skuLabel = product.sku || product.model || 'B2B';

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Início</Link>
          <ChevronRight size={13} />
          {category ? (
            <>
              <Link href={`/produtos?categoria=${category.slug}`}>{category.name}</Link>
              <ChevronRight size={13} />
            </>
          ) : (
            <>
              <Link href="/produtos">Produtos</Link>
              <ChevronRight size={13} />
            </>
          )}
          <span>{product.name}</span>
        </div>

        {/* Grade Superior: Galeria + Info */}
        <div className={styles.mainGrid}>
          {/* Galeria de Fotos */}
          <div className={styles.galleryCol}>
            <div className={styles.mainImageFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt={product.name}
                className={styles.mainImage}
              />
            </div>

            {allImages.length > 1 && (
              <div className={styles.thumbnailRow}>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`${styles.thumbBtn} ${selectedImage === img ? styles.thumbBtnActive : ''}`}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna de Informações e CTA */}
          <div className={styles.infoCol}>
            <div className={styles.titleRow}>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <div className={styles.stockBadge}>
                <span className={styles.stockDot} />
                <span>Em estoque</span>
              </div>
            </div>

            <div className={styles.metaSubline}>
              {brandLabel} | {skuLabel}
            </div>

            {/* Características Principais em Bullets */}
            <div className={styles.featuresSection}>
              <h3 className={styles.featuresHeading}>Características principais:</h3>
              <ul className={styles.featureList}>
                {product.features && product.features.length > 0 ? (
                  product.features.map((feat, idx) => (
                    <li key={idx} className={styles.featureItem}>
                      <span className={styles.featureDot} />
                      <span>{feat}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className={styles.featureItem}>
                      <span className={styles.featureDot} />
                      <span>{product.shortDesc || product.description}</span>
                    </li>
                    <li className={styles.featureItem}>
                      <span className={styles.featureDot} />
                      <span>Garantia oficial e homologação B2B</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Botão Verde WhatsApp de Alta Conversão */}
            <button
              onClick={handleWhatsApp}
              className={styles.whatsappActionBtn}
              id="product-whatsapp-inquiry-btn"
            >
              <MessageCircle size={20} fill="#0B0F14" stroke="none" />
              <span>Consultar pelo WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Especificações Técnicas */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className={styles.specsContainer}>
            <h2 className={styles.specsHeading}>Especificações Técnicas</h2>
            <table className={styles.specsTable}>
              <tbody>
                {Object.entries(product.specs).map(([key, value]) => (
                  <tr key={key}>
                    <td className={styles.specsKey}>{key}</td>
                    <td className={styles.specsVal}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
