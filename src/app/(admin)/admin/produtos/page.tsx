import React from 'react';
import { getProducts, getCategories } from '@/lib/db';
import { ProdutosListClient } from './ProdutosListClient';

export const revalidate = 0;

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([
    getProducts({ sortBy: 'order' }),
    getCategories(),
  ]);

  return <ProdutosListClient initialProducts={products} categories={categories} />;
}
