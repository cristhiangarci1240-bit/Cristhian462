import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug, getCategoryById } from '@/lib/db';
import { ProductDetailClient } from '@/components/public/ProductDetailClient';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return {
      title: 'Produto não encontrado',
    };
  }

  return {
    title: `${product.name} | Especificações Técnicas`,
    description: product.shortDesc || product.description,
    openGraph: {
      title: `${product.name} | TECH7 B2B`,
      description: product.shortDesc || product.description,
      images: [{ url: product.mainImage }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const category = await getCategoryById(product.categoryId);

  return <ProductDetailClient product={product} category={category} />;
}
