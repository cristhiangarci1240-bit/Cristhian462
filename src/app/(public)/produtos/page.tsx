import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getCategories, getProducts } from '@/lib/db';
import { CatalogClient } from '@/components/public/CatalogClient';

export const metadata: Metadata = {
  title: 'Catálogo de Produtos & Equipamentos B2B',
  description: 'Consulte nossa linha corporativa de computadores, smartphones empresariais, equipamentos de conferência e tecnologia corporativa.',
};

export const revalidate = 0;

export default async function ProdutosPage() {
  const [categories, products] = await Promise.all([
    getCategories({ isActive: true }),
    getProducts({ isActive: true }),
  ]);

  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Carregando catálogo...</div>}>
      <CatalogClient products={products} categories={categories} />
    </Suspense>
  );
}
